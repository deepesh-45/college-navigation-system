import { useState } from 'react';
import { GreetingScreen } from './components/GreetingScreen';
import { MobileNavigationView } from './components/MobileNavigationView';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<'greeting' | 'navigation'>('greeting');
  const [userRole, setUserRole] = useState<string>('Visitor');

  const handleSelectRole = (role: string) => {
    setUserRole(role);
    setCurrentScreen('navigation');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-l3 selection:bg-blue-600 selection:text-white">
      {currentScreen === 'greeting' ? (
        <GreetingScreen onSelectRole={handleSelectRole} />
      ) : (
        <MobileNavigationView
          userRole={userRole}
          onBackToGreeting={() => setCurrentScreen('greeting')}
        />
      )}
    </div>
  );
}

export default App;
