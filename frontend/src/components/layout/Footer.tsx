import React from 'react';

export default function Footer() {
  return (
    <footer
      className="mt-auto py-6 text-center text-xs"
      style={{
        backgroundColor: 'hsl(var(--header))',
        color: 'hsl(var(--header-foreground))',
      }}
    >
      <div className="container-page">
        <p className="m-0 leading-normal">
          Batanes Jobs · A local job portal for the province of Batanes. © 2026 All rights reserved.
        </p>
      </div>
    </footer>
  );
}
