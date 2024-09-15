import { useState, useEffect } from 'react';
import Header from './components/Header';
import MemberShowcase from './components/MemberShowcase';
import Footer from './components/Footer';
import BackToTopButton from './components/BackToTopButton';
import './App.css';

function App() {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    // Generate 100 fake members for testing
    const fetchMembers = () => {
      const fakeMembers = Array.from({ length: 100 }, (_, index) => ({
        id: index + 1,
        name: `Member ${index + 1}`,
        avatarUrl: `https://via.placeholder.com/56?text=${index + 1}`, // Placeholder avatar
      }));
      setMembers(fakeMembers);
    };

    fetchMembers();
  }, []);

  return (
    <>
      <Header />
      <MemberShowcase members={members} />
      <BackToTopButton />
      <Footer />
    </>
  );
}

export default App;
