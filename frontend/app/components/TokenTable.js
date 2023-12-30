import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";

import { TbWorldHeart } from "react-icons/tb";
import { FaXTwitter, FaRegPenToSquare  } from "react-icons/fa6";
import { FaTelegramPlane } from "react-icons/fa";
import { PiScroll } from "react-icons/pi";

const TokenTable = ({ tokens }) => {
  const columns = React.useMemo(
    () => [
      // first column for debugging and blacklist/whitelist
      {
        id: 'identifier',
        header: 'identifier',
        cell: ({ row }) => row.original.identifier,
      },
      {
        id: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img src={row.original.logo_url} alt="" style={{ height: "24px", marginRight: "8px" }} />
              <span>{row.original.name}</span>
              <span style={{ marginLeft: "8px", color: "gray" }}>{row.original.ticker}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
              {row.original.website && (
                <a href={row.original.website} target="_blank" rel="noopener noreferrer" style={{ marginRight: '8px' }}>
                  <TbWorldHeart />
                </a>
              )}
              {renderSocialLinks(row.original.social_links || {})}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'current_price',
        header: 'Price',
        cell: ({ getValue }) => formatPrice(getValue()),
      },
      {
        accessorKey: 'current_market_cap',
        header: 'Market Cap',
        cell: ({ getValue }) => formatMarketCap(getValue()),
      },
      // ... Add other columns here
    ],
    []
  );


  const renderSocialLinks = (socialLinks) => {
    const socialIcons = {
      blog: <FaRegPenToSquare />,
      twitter: <FaXTwitter />,
      telegram: <FaTelegramPlane />,
      whitepaper: <PiScroll />,
    };

    return Object.entries(socialLinks).map(([key, url]) => {
      if (url) {
        return (
          <a key={key} href={url} target="_blank" rel="noopener noreferrer" style={{ margin: '0 4px' }}>
            {socialIcons[key] || '🔗'}
          </a>
        );
      }
      return null;
    });
  };



  const formatUSD = (value, digits) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  };
  
  const formatPrice = value => {
    if (value === null) {
      return "-";
    }
    const numericValue = Number(value);
    if (isNaN(numericValue)) {
      return "-";
    }
  
    if (numericValue >= 1) {
      return formatUSD(numericValue, 2);
    } else {
      const stringValue = numericValue.toPrecision(4);
      const fractionDigits = stringValue.includes('.') ? stringValue.split('.')[1].length : 0;
      return formatUSD(numericValue, fractionDigits);
    }
  };
  
  const formatMarketCap = value => {
    if (value === null) {
      return "-";
    }
    const numericValue = Number(value);
    return isNaN(numericValue) ? "-" : formatUSD(Math.round(numericValue), 0);
  };
  

  const table = useReactTable({
    data: tokens,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    // Include other options and models as needed
  });

  return (
    <table className="min-w-full divide-y divide-gray-200 text-sm">
      <thead className="bg-gray-700 text-white">
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id} colSpan={header.colSpan} className="px-6 py-3 text-left tracking-wider">
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody className="bg-white">
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id} className="hover:bg-gray-100">
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};


export default TokenTable;
