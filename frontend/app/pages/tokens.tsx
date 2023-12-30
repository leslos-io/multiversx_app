// frontend/app/pages/tokens.js
import React, { useState, useEffect } from 'react';
import TokenTable from '../components/TokenTable';

const TokensPage = () => {
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/token-data');
        const data = await response.json();
        setTokens(data);
      } catch (error) {
        console.error('Error fetching tokens:', error);
      }
    };

    fetchTokens();
  }, []);

  return (
    <div>
      <h1>Token Data</h1>
      <TokenTable tokens={tokens} />
    </div>
  );
};

export default TokensPage;
