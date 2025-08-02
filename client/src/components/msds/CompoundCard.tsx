import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ExternalLink } from 'lucide-react';
import { PubChemCompound } from '../../services/pubchem';

interface CompoundCardProps {
  compound: PubChemCompound;
}

const CompoundCard: React.FC<CompoundCardProps> = ({ compound }) => {
  const pubchemUrl = `https://pubchem.ncbi.nlm.nih.gov/compound/${compound.name}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-1">{compound.name}</h3>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">Formula: {compound.formula}</span>
            <a
              href={pubchemUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center space-x-1"
            >
              <span>View on PubChem</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        <FileText className="w-6 h-6 text-blue-400 flex-shrink-0" />
      </div>

      <div className="space-y-4">
        {Object.entries({
          'Hazards': compound.hazards,
          'First Aid': compound.firstAid,
          'Safe Handling': compound.handling,
          'Storage': compound.storage,
          'Disposal': compound.disposal
        }).map(([title, items]) => items.length > 0 && (
          <div key={title}>
            <h4 className="text-sm font-medium text-gray-300 mb-2">{title}</h4>
            <ul className="list-disc list-inside text-gray-400 text-sm space-y-1">
              {items.map((item, idx) => (
                <li key={idx} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default CompoundCard;