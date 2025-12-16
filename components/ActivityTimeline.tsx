
import React, { useEffect, useState } from 'react';
import { MOCK_ACTIVITIES } from '../constants';
import { Clock, ShoppingCart, Package, Users, Server, AlertCircle } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebase';
import { Activity } from '../types';

const ActivityTimeline: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Listen to real logs
    const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(20));
    
    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      if (snapshot.empty) {
        setActivities(MOCK_ACTIVITIES); // Fallback only if absolutely no real data
      } else {
        const fetchedLogs = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: data.type,
            description: data.description,
            user: data.user,
            timestamp: new Date(data.timestamp).toLocaleString() // Format timestamp
          } as Activity;
        });
        setActivities(fetchedLogs);
      }
    }, (err) => {
      console.warn("Log fetch error", err);
      setActivities(MOCK_ACTIVITIES);
    });

    return () => unsubscribe();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER': return <ShoppingCart size={16} className="text-blue-500" />;
      case 'PRODUCT': return <Package size={16} className="text-mono-primary" />;
      case 'VENDOR': return <Users size={16} className="text-green-500" />;
      case 'SYSTEM': return <Server size={16} className="text-gray-500" />;
      default: return <AlertCircle size={16} className="text-mono-secondary" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-mono-light shadow-sm p-6 h-full">
      <h3 className="text-lg font-semibold text-mono-text mb-4 flex items-center">
        <Clock size={18} className="mr-2 text-mono-primary" />
        Activity Timeline
      </h3>
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-mono-light before:to-transparent">
        {activities.map((activity) => (
          <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Icon */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-mono-light shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              {getIcon(activity.type)}
            </div>
            
            {/* Content */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-mono-light shadow-sm">
              <div className="flex items-center justify-between space-x-2 mb-1">
                <span className="font-bold text-mono-text text-sm">{activity.user}</span>
                <time className="font-caveat font-medium text-xs text-mono-textSec">{activity.timestamp}</time>
              </div>
              <p className="text-sm text-mono-textSec leading-snug">{activity.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityTimeline;