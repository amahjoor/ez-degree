import { useState, useEffect } from "react";
import { Professor } from '@/types/professor';

interface ProfessorsTabProps {
  isApiAvailable: boolean;
  API_BASE_URL: string;
}

export function ProfessorsTab({ isApiAvailable, API_BASE_URL }: ProfessorsTabProps) {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Fetch professors on component mount
  useEffect(() => {
    if (!isApiAvailable) return;

    const fetchProfessors = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_BASE_URL}/professors/`);
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setProfessors(data);
      } catch (err) {
        console.error("Error fetching professors:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch professors");
        setProfessors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessors();
  }, [isApiAvailable, API_BASE_URL]);

  // Filter professors based on search term
  const filteredProfessors = professors.filter(professor => 
    professor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mb-8 bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          Professors
        </h2>
        <div className="flex space-x-4">
          <input
            type="text"
            className="w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search professors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Professor Results */}
      <div className="mt-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
            <p className="mt-2">Loading professors...</p>
          </div>
        ) : filteredProfessors.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No professors found. Try adjusting your search criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProfessors.map((professor) => (
              <div
                key={professor.id}
                className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900">{professor.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{professor.department}</p>
                {professor.email && (
                  <p className="text-sm text-blue-600 mt-1">{professor.email}</p>
                )}
                {professor.office && (
                  <p className="text-sm text-gray-600 mt-1">Office: {professor.office}</p>
                )}
                {professor.phone && (
                  <p className="text-sm text-gray-600 mt-1">Phone: {professor.phone}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
    </div>
  );
} 