// frontend/app/components/TokenTable.js

import React from 'react';

const TokenTable = ({ tokens }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Price</th>
          {/* Add other headers */}
        </tr>
      </thead>
      <tbody>
        {tokens.map((token, index) => (
          <tr key={index}>
            <td>{token.name}</td>
            <td>{token.current_price}</td>
            {/* Render other token details */}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TokenTable;
