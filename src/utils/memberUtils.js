import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';

/**
 * Member utility functions for handling application to member transfers
 */

/**
 * Validate member data before adding to members collection
 * @param {Object} memberData - The member data to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateMemberData = (memberData) => {
  const errors = [];
  
  // Required fields validation
  if (!memberData.name || memberData.name.trim().length < 2) {
    errors.push('নাম কমপক্ষে ২ অক্ষরের হতে হবে');
  }
  
  if (!memberData.phone || memberData.phone.trim().length < 10) {
    errors.push('বৈধ ফোন নম্বর প্রয়োজন');
  }
  
  if (!memberData.email || !isValidEmail(memberData.email)) {
    errors.push('বৈধ ইমেইল ঠিকানা প্রয়োজন');
  }
  
  if (!memberData.address || memberData.address.trim().length < 5) {
    errors.push('সম্পূর্ণ ঠিকানা প্রয়োজন');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Check if email format is valid
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if member already exists in the database
 * @param {string} email - Member email
 * @param {string} phone - Member phone
 * @returns {Promise<Object>} - Result with exists flag and matching field
 */
export const checkMemberExists = async (email, phone) => {
  try {
    // Check by email first
    if (email && email.trim()) {
      const emailQuery = query(
        collection(db, 'members'), 
        where('email', '==', email.trim().toLowerCase())
      );
      const emailSnapshot = await getDocs(emailQuery);
      if (!emailSnapshot.empty) {
        return { 
          exists: true, 
          field: 'email', 
          existingMember: emailSnapshot.docs[0].data() 
        };
      }
    }

    // Check by phone
    if (phone && phone.trim()) {
      const phoneQuery = query(
        collection(db, 'members'), 
        where('phone', '==', phone.trim())
      );
      const phoneSnapshot = await getDocs(phoneQuery);
      if (!phoneSnapshot.empty) {
        return { 
          exists: true, 
          field: 'phone', 
          existingMember: phoneSnapshot.docs[0].data() 
        };
      }
    }

    return { exists: false };
  } catch (error) {
    console.error('Error checking member existence:', error);
    throw new Error('সদস্য যাচাই করতে সমস্যা হয়েছে');
  }
};

/**
 * Transfer approved application to members list
 * @param {Object} application - The approved application data
 * @returns {Promise<Object>} - Result with success flag and member data
 */
export const transferApplicationToMember = async (application) => {
  try {
    // Validate application data
    const validation = validateMemberData(application);
    if (!validation.isValid) {
      throw new Error(`ডেটা ভ্যালিডেশন ব্যর্থ: ${validation.errors.join(', ')}`);
    }

    // Check if member already exists
    const memberCheck = await checkMemberExists(application.email, application.phone);
    if (memberCheck.exists) {
      throw new Error(
        `এই সদস্য ইতিমধ্যে সদস্য তালিকায় রয়েছে (${
          memberCheck.field === 'email' ? 'ইমেইল' : 'ফোন নম্বর'
        } দিয়ে)`
      );
    }

    // Prepare member data
    const memberData = {
      name: application.name.trim(),
      phone: application.phone.trim(),
      email: application.email.trim().toLowerCase(),
      address: application.address.trim(),
      photoURL: null, // No photo from application
      createdAt: new Date(),
      updatedAt: new Date(),
      addedFrom: 'application', // Track source
      applicationId: application.id, // Reference to original application
      applicationDate: application.createdAt, // Keep original application date
      approvedAt: new Date() // When it was approved
    };

    // Add to members collection
    const memberDocRef = await addDoc(collection(db, 'members'), memberData);
    
    console.log('Member successfully added to members list:', {
      id: memberDocRef.id,
      ...memberData
    });

    return {
      success: true,
      memberId: memberDocRef.id,
      memberData
    };
  } catch (error) {
    console.error('Error transferring application to member:', error);
    throw error;
  }
};

/**
 * Update application status after successful transfer
 * @param {string} applicationId - The application document ID
 * @param {string} memberId - The newly created member document ID
 * @returns {Promise<void>}
 */
export const updateApplicationAfterTransfer = async (applicationId, memberId) => {
  try {
    await updateDoc(doc(db, 'memberApplications', applicationId), {
      status: 'approved',
      updatedAt: new Date(),
      transferredToMembers: true,
      transferredAt: new Date(),
      memberId: memberId // Reference to the member document
    });
  } catch (error) {
    console.error('Error updating application after transfer:', error);
    throw new Error('আবেদনের স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে');
  }
};

/**
 * Get member statistics
 * @returns {Promise<Object>} - Statistics about members and applications
 */
export const getMemberStatistics = async () => {
  try {
    // Get total members
    const membersSnapshot = await getDocs(collection(db, 'members'));
    const totalMembers = membersSnapshot.size;
    
    // Get members added from applications
    const applicationMembersQuery = query(
      collection(db, 'members'),
      where('addedFrom', '==', 'application')
    );
    const applicationMembersSnapshot = await getDocs(applicationMembersQuery);
    const membersFromApplications = applicationMembersSnapshot.size;
    
    // Get pending applications
    const pendingApplicationsQuery = query(
      collection(db, 'memberApplications'),
      where('status', '==', 'pending')
    );
    const pendingApplicationsSnapshot = await getDocs(pendingApplicationsQuery);
    const pendingApplications = pendingApplicationsSnapshot.size;
    
    // Get approved applications
    const approvedApplicationsQuery = query(
      collection(db, 'memberApplications'),
      where('status', '==', 'approved')
    );
    const approvedApplicationsSnapshot = await getDocs(approvedApplicationsQuery);
    const approvedApplications = approvedApplicationsSnapshot.size;

    return {
      totalMembers,
      membersFromApplications,
      pendingApplications,
      approvedApplications,
      manuallyAddedMembers: totalMembers - membersFromApplications
    };
  } catch (error) {
    console.error('Error getting member statistics:', error);
    return {
      totalMembers: 0,
      membersFromApplications: 0,
      pendingApplications: 0,
      approvedApplications: 0,
      manuallyAddedMembers: 0
    };
  }
};

/**
 * Bulk transfer multiple applications to members list
 * @param {Array} applications - Array of application objects to transfer
 * @returns {Promise<Object>} - Result with success/failure counts
 */
export const bulkTransferApplications = async (applications) => {
  const results = {
    successful: [],
    failed: [],
    skipped: []
  };

  for (const application of applications) {
    try {
      // Check if already transferred
      if (application.transferredToMembers) {
        results.skipped.push({
          application,
          reason: 'ইতিমধ্যে সদস্য তালিকায় যুক্ত'
        });
        continue;
      }

      // Transfer to members list
      const transferResult = await transferApplicationToMember(application);
      
      // Update application status
      await updateApplicationAfterTransfer(application.id, transferResult.memberId);
      
      results.successful.push({
        application,
        memberId: transferResult.memberId
      });
      
    } catch (error) {
      results.failed.push({
        application,
        error: error.message
      });
    }
  }

  return results;
};

export default {
  validateMemberData,
  checkMemberExists,
  transferApplicationToMember,
  updateApplicationAfterTransfer,
  getMemberStatistics,
  bulkTransferApplications
};

