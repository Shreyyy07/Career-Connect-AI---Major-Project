import { Bot, Users } from 'lucide-react';

interface InterviewSelectionProps {
  onNavigate: (page: string) => void;
}

export const InterviewSelection = ({ onNavigate }: InterviewSelectionProps) => {
  const handleStartAIInterview = () => {
    alert('AI Interview feature coming soon!');
  };

  const handleBookHRInterview = () => {
    alert('HR Interview booking feature coming soon!');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Select Interview Type</h1>
        <p className="text-gray-600">Choose how you want to be interviewed</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <Bot className="text-blue-600" size={40} />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">AI-Powered Interview</h2>

          <p className="text-gray-600 text-center mb-6">
            Get instant feedback with our AI-powered interview system. Answer questions on video
            and receive detailed analysis of your performance including emotion detection and
            technical evaluation.
          </p>

          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">8 Progressive Levels</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Instant Feedback</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Emotion Analysis</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Technical Scoring</span>
          </div>

          <button
            onClick={handleStartAIInterview}
            className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <Bot size={20} />
            Start AI Interview
          </button>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="text-purple-600" size={40} />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">HR Interview</h2>

          <p className="text-gray-600 text-center mb-6">
            Schedule a live interview session with our HR team. Book an available slot and get
            personalized feedback from experienced interviewers.
          </p>

          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">Live Session</span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">Personalized Feedback</span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">Flexible Scheduling</span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">Human Touch</span>
          </div>

          <button
            onClick={handleBookHRInterview}
            className="w-full bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
          >
            <Users size={20} />
            Book HR Interview
          </button>
        </div>
      </div>
    </div>
  );
};
