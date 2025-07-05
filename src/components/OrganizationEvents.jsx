import { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Plus, Calendar, Image, Video, Trash2, Upload, Play } from 'lucide-react';

const OrganizationEvents = () => {
  const [events, setEvents] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    files: []
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'organizationEvents'));
      const eventsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by date (newest first)
      eventsData.sort((a, b) => new Date(b.createdAt?.toDate()) - new Date(a.createdAt?.toDate()));
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      files: files
    }));
  };

  const uploadFiles = async (files) => {
    const uploadPromises = files.map(async (file) => {
      const storageRef = ref(storage, `event-media/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        url: downloadURL,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'video',
        size: file.size
      };
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let mediaFiles = [];
      if (formData.files.length > 0) {
        mediaFiles = await uploadFiles(formData.files);
      }

      const eventData = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        location: formData.location,
        mediaFiles: mediaFiles,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'organizationEvents'), eventData);

      setFormData({
        title: '',
        description: '',
        date: '',
        location: '',
        files: []
      });
      setShowAddForm(false);
      fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('আপনি কি এই কার্যক্রম মুছে ফেলতে চান?')) {
      try {
        await deleteDoc(doc(db, 'organizationEvents', eventId));
        fetchEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      location: '',
      files: []
    });
    setShowAddForm(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">সংগঠন কার্যক্রম</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-4 py-2 rounded-lg transition-all duration-300"
        >
          <Plus className="w-5 h-5" />
          <span>নতুন কার্যক্রম যোগ করুন</span>
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">নতুন কার্যক্রম যোগ করুন</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="title"
                placeholder="কার্যক্রমের নাম"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
            <input
              type="text"
              name="location"
              placeholder="স্থান"
              value={formData.location}
              onChange={handleInputChange}
              required
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
            <textarea
              name="description"
              placeholder="কার্যক্রমের বিবরণ"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows="4"
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
            <div>
              <label className="block text-gray-300 mb-2">ছবি এবং ভিডিও আপলোড করুন</label>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-500 file:text-white hover:file:bg-cyan-600"
              />
              {formData.files.length > 0 && (
                <div className="mt-2">
                  <p className="text-gray-300 text-sm mb-2">নির্বাচিত ফাইলসমূহ:</p>
                  <div className="space-y-1">
                    {formData.files.map((file, index) => (
                      <div key={index} className="flex items-center space-x-2 text-gray-400 text-sm">
                        {file.type.startsWith('image/') ? (
                          <Image className="w-4 h-4" />
                        ) : (
                          <Video className="w-4 h-4" />
                        )}
                        <span>{file.name}</span>
                        <span>({formatFileSize(file.size)})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white px-6 py-3 rounded-lg transition-all duration-300 disabled:opacity-50"
              >
                <Upload className="w-5 h-5" />
                <span>{loading ? 'সংরক্ষণ করা হচ্ছে...' : 'সংরক্ষণ করুন'}</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors duration-300"
              >
                বাতিল
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-6">
        {events.map((event) => (
          <div key={event.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">{event.title}</h3>
                <div className="flex items-center space-x-4 text-gray-300 mb-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(event.date).toLocaleDateString('bn-BD')}</span>
                  </div>
                  <span>•</span>
                  <span>{event.location}</span>
                </div>
                <p className="text-gray-300 mb-4">{event.description}</p>
              </div>
              <button
                onClick={() => handleDelete(event.id)}
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Media Gallery */}
            {event.mediaFiles && event.mediaFiles.length > 0 && (
              <div>
                <h4 className="text-lg font-medium text-white mb-3">মিডিয়া গ্যালারি</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {event.mediaFiles.map((media, index) => (
                    <div key={index} className="relative group">
                      {media.type === 'image' ? (
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-700">
                          <img
                            src={media.url}
                            alt={media.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-700 relative">
                          <video
                            src={media.url}
                            className="w-full h-full object-cover"
                            controls={false}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 group-hover:bg-opacity-30 transition-all duration-300">
                            <Play className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-white text-xs truncate">{media.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <p className="text-gray-400 text-sm">
                যোগ করা হয়েছে: {event.createdAt?.toDate().toLocaleDateString('bn-BD')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">কোন কার্যক্রম পাওয়া যায়নি</p>
          <p className="text-gray-500">নতুন কার্যক্রম যোগ করতে উপরের বাটনে ক্লিক করুন</p>
        </div>
      )}
    </div>
  );
};

export default OrganizationEvents;

