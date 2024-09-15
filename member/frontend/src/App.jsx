import { useState, useEffect } from 'react';
import Header from './components/Header';
import MemberShowcase from './components/MemberShowcase';
import Footer from './components/Footer';
import BackToTopButton from './components/BackToTopButton';
import './App.css';

function App() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      const response = await fetch('http://localhost:3000/members'); // Update with your backend URL
      const data = await response.json();
      setMembers(data);
      setLoading(false);
    };

    fetchMembers();
  }, []);

  return (
    <>
      <Header />
      {!loading ? (
        <MemberShowcase members={members} />
      ) : (
        <div>Loading members...</div>
      )}
      <BackToTopButton />
      <Footer />
    </>
  );
}

export default App;
