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
        <h1 className="text-3xl font-black text-white mb-2">StrikeSignal Blog</h1>
        <p className="text-slate-500">The latest news, updates, and feature releases from the StrikeSignal team.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-[#0d1527] border border-white/5 rounded-2xl p-12 text-center text-slate-500">
          No blog posts published yet. Check back soon!
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map(post => (
            <article key={post.id} className="bg-[#0d1527] border border-white/5 rounded-2xl p-6 md:p-8 hover:border-white/10 transition-colors">
              <h2 className="text-2xl font-black text-white mb-2">{post.title}</h2>
              <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-6">
                {new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div 
                className="prose prose-invert prose-sm max-w-none prose-p:text-slate-300 prose-a:text-blue-400"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
