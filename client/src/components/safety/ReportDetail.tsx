import React from 'react';
import { Clock, MapPin, FileText, Image, Paperclip } from 'lucide-react';
import { SafetyReport } from '../../types/safety';

interface ReportDetailProps {
  report: SafetyReport;
}

const ReportDetail: React.FC<ReportDetailProps> = ({ report }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-4 border-t border-slate-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">Submitted: {formatDate(report.submittedAt)}</span>
          </div>
          
          {report.location && (
            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300">{report.location}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">Report ID: {report.id.substring(0, 12)}...</span>
          </div>
          
          {report.lastUpdated && (
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300">Updated: {formatDate(report.lastUpdated)}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Description</h4>
        <div className="p-3 bg-slate-800/50 rounded-lg text-white text-sm whitespace-pre-wrap">
          {report.description}
        </div>
      </div>
      
      {report.attachments && report.attachments.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">Attachments ({report.attachments.length})</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {report.attachments.map((attachment, index) => (
              <div key={index} className="overflow-hidden rounded-lg bg-slate-800/50">
                {attachment.type.startsWith('image/') ? (
                  <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block">
                    <div className="aspect-square overflow-hidden">
                      <img 
                        src={attachment.url} 
                        alt={attachment.name} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="p-2 text-xs text-gray-400 truncate">
                      {attachment.name}
                    </div>
                  </a>
                ) : (
                  <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block p-3">
                    <div className="aspect-square flex items-center justify-center">
                      <Paperclip className="w-8 h-8 text-blue-400" />
                    </div>
                    <div className="text-xs text-gray-400 truncate text-center">
                      {attachment.name}
                    </div>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDetail;