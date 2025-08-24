// app/(main)/coverletter/layout.jsx
export default function CoverLetterLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {children}
      </div>
    </div>
  );
}
