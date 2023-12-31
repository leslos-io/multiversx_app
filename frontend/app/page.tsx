"use client"
// frontend/app/page.tsx
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import TokenTable from './components/TokenTable';

export default function Home() {
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/token-data');
        const data = await response.json();
        console.log(data); // Log the fetched data
        setTokens(data);
      } catch (error) {
        console.error('Error fetching tokens:', error);
      }
    };

    fetchTokens();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <TokenTable tokens={tokens} />
    </main>
  );
}
