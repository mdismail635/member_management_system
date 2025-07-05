import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Calendar, Eye, Image, Video, Play } from 'lucide-react';

const PublicOrganizationEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white text-lg">লোড হচ্ছে...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Eye className="w-6 h-6 text-green-400" />
        <h2 className="text-2xl font-bold text-white">সংগঠন কার্যক্রম</h2>
      </div>

      {/* Events List */}
      <div className="space-y-6">
        {events.map((event) => (
          <div key={event.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-green-500/50 transition-all duration-300">
            <div className="flex-1 mb-4">
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
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                            onClick={() => window.open(media.url, '_blank')}
                          />
                        </div>
                      ) : (
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-700 relative cursor-pointer"
                             onClick={() => window.open(media.url, '_blank')}>
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
        </div>
      )}
    </div>
  );
};

export default PublicOrganizationEvents;

