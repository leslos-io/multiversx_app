import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";

import { TbWorldHeart } from "react-icons/tb";
import { FaXTwitter, FaRegPenToSquare } from "react-icons/fa6";
import { FaTelegramPlane } from "react-icons/fa";
import { PiScroll } from "react-icons/pi";

const TokenTable = ({ tokens }) => {
  const columns = React.useMemo(
    () => [
      // first column for debugging and blacklist/whitelist
      {
        id: "identifier",
        header: "identifier",
        cell: ({ row }) => row.original.identifier,
      },
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => (
          <div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <img
                src={row.original.logo_url}
                alt=""
                style={{ height: "24px", marginRight: "8px" }}
              />
              <span>{row.original.name}</span>
              <span style={{ marginLeft: "8px", color: "gray" }}>
                {row.original.ticker}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: "4px",
              }}
            >
              {row.original.website && (
                <a
                  href={row.original.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ marginRight: "8px" }}
                >
                  <TbWorldHeart />
                </a>
              )}
              {renderSocialLinks(row.original.social_links || {})}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "current_price",
        header: "Price",
        cell: ({ getValue }) => formatPrice(getValue()),
      },
      {
        accessorKey: "price_1h_ago",
        header: "1h %",
        cell: ({ row }) => {
          const { value, colorClass } = calculatePercentageChange(
            row.original.current_price,
            row.original.price_1h_ago
          );
          return <span className={colorClass}>{value}</span>;
        },
      },
      {
        accessorKey: "price_24h_ago",
        header: "24h %",
        cell: ({ row }) => {
          const { value, colorClass } = calculatePercentageChange(
            row.original.current_price,
            row.original.price_24h_ago
          );
          return <span className={colorClass}>{value}</span>;
        },
      },
      {
        accessorKey: "price_7d_ago",
        header: "7d %",
        cell: ({ row }) => {
          const { value, colorClass } = calculatePercentageChange(
            row.original.current_price,
            row.original.price_7d_ago
          );
          return <span className={colorClass}>{value}</span>;
        },
      },
      {
        accessorKey: "current_market_cap",
        header: "Market Cap",
        cell: ({ getValue }) => formatMarketCap(getValue()),
      },
      {
        accessorKey: "circulating_supply",
        header: "Circulating Supply",
        cell: ({ row }) => formatSupply(row.original.circulating_supply, row.original.ticker),
      },
      // ... Add other columns here
    ],
    []
  );

  const formatSupply = (supply, ticker) => {
    // Assuming 'supply' is a number and 'max_supply' is available in your token data,
    // which represents the maximum possible supply.
    // If 'max_supply' is not available or you don't need a bar, you can remove that part.
    const maxSupply = supply; // replace with your token's max supply if available
    const supplyPercentage = maxSupply ? (supply / maxSupply) * 100 : 0;
  
    return (
      <div>
        <div>
          {supply} {ticker}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${supplyPercentage}%` }}
          ></div>
        </div>
      </div>
    );
  };


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
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ margin: "0 4px" }}
          >
            {socialIcons[key] || "🔗"}
          </a>
        );
      }
      return null;
    });
  };

  const formatPercentageChangeWithPrevious = (currentValue, previousValue) => {
    if (currentValue === null || previousValue === null) {
      return "-";
    }
  
    const currentNumericValue = Number(currentValue);
    const previousNumericValue = Number(previousValue);
  
    if (isNaN(currentNumericValue) || isNaN(previousNumericValue)) {
      return "-";
    }
  
    const percentageChange = ((currentNumericValue - previousNumericValue) / previousNumericValue) * 100;
    const formattedPercentageChange = `${percentageChange.toFixed(2)}%`;
    const formattedPreviousValue = formatPrice(previousNumericValue);
  
    return `${formattedPercentageChange} (${formattedPreviousValue})`;
  };

  const calculatePercentageChange = (currentValue, pastValue) => {
    if (currentValue === null || pastValue === null) {
      return { value: "-", colorClass: "" };
    }
  
    const currentNumericValue = Number(currentValue);
    const pastNumericValue = Number(pastValue);
  
    if (
      isNaN(currentNumericValue) ||
      isNaN(pastNumericValue) ||
      pastNumericValue === 0
    ) {
      return { value: "-", colorClass: "" };
    }
  
    const percentageChange =
      ((currentNumericValue - pastNumericValue) / pastNumericValue) * 100;
  
    const colorClass = percentageChange >= 0 ? "text-green-500" : "text-red-500";
  
    return { value: `${percentageChange.toFixed(2)}%`, colorClass };
  };

  
  const formatPercentageChange = (currentValue, pastValue) => {
    if (currentValue === null || pastValue === null) {
      return "-";
    }

    const currentNumericValue = Number(currentValue);
    const pastNumericValue = Number(pastValue);

    if (
      isNaN(currentNumericValue) ||
      isNaN(pastNumericValue) ||
      pastNumericValue === 0
    ) {
      return "-";
    }

    
    const percentageChange =
      ((currentNumericValue - pastNumericValue) / pastNumericValue) * 100;
    return `${percentageChange.toFixed(2)}%`;
  };

  const formatUSD = (value, digits) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  };

  const formatPrice = (value) => {
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
      const fractionDigits = stringValue.includes(".")
        ? stringValue.split(".")[1].length
        : 0;
      return formatUSD(numericValue, fractionDigits);
    }
  };

  const formatMarketCap = (value) => {
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
              <th
                key={header.id}
                colSpan={header.colSpan}
                className="px-6 py-3 text-left tracking-wider"
              >
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
      <tbody className="bg-white text-black">
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
