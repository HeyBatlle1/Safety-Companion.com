import React from 'react';
import { motion } from 'framer-motion';
import { Map } from 'lucide-react';
import GoogleMapsComponent from '../components/maps/GoogleMapsComponent';
import BackButton from '../components/navigation/BackButton';

const Maps = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex items-center justify-between">
          <BackButton />
          <div className="text-center flex-1">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center space-x-2 mb-4"
            >
              <Map className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                Interactive Map
              </h1>
            </motion.div>
          </div>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>

        <div className="text-center">
          <motion.p 
            className="text-gray-300 max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Full Google Maps integration with satellite imagery, street view, and real-time directions.
            Get your current location and plan trips to any destination in Indianapolis and beyond.
          </motion.p>
        </div>

        <GoogleMapsComponent />
      </motion.div>
    </div>
  );
};

export default Maps;