import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const API = import.meta.env.VITE_API_URL;

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/blog`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setPosts(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-black mb-2">StrikeSignal Blog</h1>
        <p className="text-gray-600">The latest news, updates, and feature releases from the StrikeSignal team.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500 shadow-sm">
          No blog posts published yet. Check back soon!
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map(post => (
            <article key={post.id} className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 hover:border-gray-300 transition-colors shadow-sm">
              {post.image && (
                <div className="mb-6 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <img src={post.image} alt={post.title} className="w-full h-auto object-cover max-h-[400px]" />
                </div>
              )}
              <h2 className="text-2xl font-black text-black mb-2">{post.title}</h2>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">
                {new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div 
                className="prose prose-sm max-w-none prose-p:text-gray-700 prose-a:text-black prose-a:font-bold prose-headings:text-black"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
