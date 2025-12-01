'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import SearchBar from '@/components/common/SearchBar';
import { Search, Users, BookOpen, User, Filter, X } from 'lucide-react';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('general');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const router = useRouter();

  const searchTypes = [
    { id: 'general', label: 'All', icon: Search },
    { id: 'classes', label: 'Classes', icon: BookOpen },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'teachers', label: 'Teachers', icon: User },
  ];

  const handleSearch = async (query, type = searchType) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${type}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      } else {
        console.error('Search failed:', response.statusText);
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (query) => {
    setSearchQuery(query);
    handleSearch(query, searchType);
  };

  const handleTypeChange = (type) => {
    setSearchType(type);
    if (searchQuery.trim()) {
      handleSearch(searchQuery, type);
    }
  };

  const handleResultClick = (result) => {
    if (result.type === 'class' || searchType === 'classes') {
      router.push(`/cpanel/classes/${result.id}`);
    } else if (result.type === 'student' || searchType === 'students') {
      router.push(`/cpanel/user-management/${result.id}`);
    } else if (result.type === 'teacher' || searchType === 'teachers') {
      router.push(`/cpanel/user-management/${result.id}`);
    }
  };

  const addFilter = (filter) => {
    if (!activeFilters.includes(filter)) {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  const removeFilter = (filter) => {
    setActiveFilters(activeFilters.filter(f => f !== filter));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
  };

  const renderResult = (result, index) => {
    const isClass = result.type === 'class' || searchType === 'classes';
    const isStudent = result.type === 'student' || searchType === 'students';
    const isTeacher = result.type === 'teacher' || searchType === 'teachers';

    return (
      <div
        key={index}
        onClick={() => handleResultClick(result)}
        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isClass && <BookOpen className="h-4 w-4 text-blue-500" />}
              {isStudent && <Users className="h-4 w-4 text-green-500" />}
              {isTeacher && <User className="h-4 w-4 text-purple-500" />}
              <h3 className="font-semibold text-gray-900">{result.name}</h3>
              {result.type && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full capitalize">
                  {result.type}
                </span>
              )}
            </div>
            
            {isClass && (
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Code:</span> {result.code}</p>
                {result.description && (
                  <p><span className="font-medium">Description:</span> {result.description}</p>
                )}
                {result.teacher && (
                  <p><span className="font-medium">Teacher:</span> {result.teacher.nama}</p>
                )}
                <p><span className="font-medium">Students:</span> {result.studentCount}</p>
              </div>
            )}
            
            {isStudent && (
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Email:</span> {result.email}</p>
                {result.nis && <p><span className="font-medium">NIS:</span> {result.nis}</p>}
                {result.kelas && <p><span className="font-medium">Class:</span> {result.kelas}</p>}
              </div>
            )}
            
            {isTeacher && (
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Email:</span> {result.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Search</h1>
            <p className="text-gray-600">Find classes, students, teachers, and more</p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <SearchBar
              placeholder="Search for classes, students, teachers..."
              onSearch={handleSearchSubmit}
              className="w-full"
              searchType={searchType}
            />
          </div>

          {/* Search Type Filters */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {searchTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => handleTypeChange(type.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors duration-200 ${
                      searchType === type.id
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Filters:</span>
                {activeFilters.map((filter) => (
                  <span
                    key={filter}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {filter}
                    <button
                      onClick={() => removeFilter(filter)}
                      className="ml-1 hover:text-blue-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          <div className="space-y-4">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Searching...</span>
              </div>
            )}

            {!isLoading && results.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {results.length} result{results.length !== 1 ? 's' : ''} found
                  </h2>
                </div>
                <div className="grid gap-4">
                  {results.map((result, index) => renderResult(result, index))}
                </div>
              </>
            )}

            {!isLoading && searchQuery && results.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
              </div>
            )}

            {!isLoading && !searchQuery && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start searching</h3>
                <p className="text-gray-600">
                  Enter a search term above to find classes, students, teachers, and more.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 