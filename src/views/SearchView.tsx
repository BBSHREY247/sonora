import React, { useState, useEffect } from 'react';
import { Search, Play, Music, Disc3, User, ListMusic } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { SongRow } from '../components/SongRow';
import { Library } from '../plugins';
import { Song, Album, Artist, Playlist } from '../types';

interface SearchViewProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ searchQuery, setSearchQuery }) => {
  const { openAlbumDetail, openArtistDetail, openPlaylistDetail } = useLibrary();
  const { playSong } = usePlayer();
  const [filterCategory, setFilterCategory] = useState<'all' | 'songs' | 'artists' | 'albums' | 'playlists'>('all');
  const [results, setResults] = useState<{
    songs: Song[];
    artists: Artist[];
    albums: Album[];
    playlists: Playlist[];
  }>({ songs: [], artists: [], albums: [], playlists: [] });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults({ songs: [], artists: [], albums: [], playlists: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await Library.searchSongs({ query: searchQuery.trim() });
        // For now, we only search songs. Future enhancement: add artist/album/playlist search
        setResults({ songs: data.songs, artists: [], albums: [], playlists: [] });
      } catch (e) {
        console.warn('Search failed:', e);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const topSong = results.songs[0];

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'songs', label: `Songs (${results.songs.length})` },
    { id: 'artists', label: `Artists (${results.artists.length})` },
    { id: 'albums', label: `Albums (${results.albums.length})` },
    { id: 'playlists', label: `Playlists (${results.playlists.length})` },
  ];

  const hasResults = results.songs.length > 0 || results.artists.length > 0 || results.albums.length > 0 || results.playlists.length > 0;

  return (
    <div className="p-4 sm:p-8 space-y-6 overflow-y-auto h-full pb-32 select-none">
      {/* Mobile Search Bar */}
      <div className="relative max-w-xl">
        <Search className="w-4 h-4 text-sonora-muted absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="What do you want to play?"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
          className="w-full bg-sonora-card border border-sonora-border/80 focus:border-sonora-accent rounded-2xl pl-11 pr-4 py-3 text-sm text-sonora-light placeholder-sonora-muted focus:outline-none shadow-inner"
        />
      </div>

      {/* Category Pills */}
      {searchQuery && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filterCategory === cat.id
                  ? 'bg-sonora-accent text-sonora-base shadow-md shadow-sonora-accent/20'
                  : 'bg-sonora-card text-sonora-muted hover:text-white border border-sonora-border/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Search Results Display */}
      {searchQuery ? (
        <div className="space-y-8">
          {/* Top Result + Top Songs Layout */}
          {(filterCategory === 'all' || filterCategory === 'songs') && topSong && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Top Result Card */}
              <div className="lg:col-span-5 space-y-3">
                <h3 className="text-sm font-bold text-sonora-light uppercase tracking-wider">
                  Top Result
                </h3>
                <div
                  onClick={() => playSong(topSong, results.songs)}
                  className="group relative p-5 rounded-2xl bg-sonora-card hover:bg-sonora-elevated border border-sonora-border/60 hover:border-sonora-accent/30 cursor-pointer transition-all shadow-md active:scale-98"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-sonora-elevated mb-4 shadow-lg">
                    {topSong.artworkUri ? (
                      <img
                        src={topSong.artworkUri}
                        alt={topSong.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sonora-muted">
                        <Music className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  <h2 className="text-xl font-extrabold text-white truncate group-hover:text-sonora-accent">
                    {topSong.title}
                  </h2>
                  <p className="text-xs text-sonora-muted mt-1">
                    Song • <span className="text-sonora-light font-semibold">{topSong.artist}</span>
                  </p>

                  <button className="absolute right-4 bottom-4 w-11 h-11 rounded-full bg-sonora-accent text-sonora-base opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 flex items-center justify-center transition-all shadow-xl shadow-sonora-accent/30">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </button>
                </div>
              </div>

              {/* Matching Songs */}
              <div className="lg:col-span-7 space-y-3">
                <h3 className="text-sm font-bold text-sonora-light uppercase tracking-wider">
                  Songs
                </h3>
                <div className="space-y-1">
                  {results.songs.slice(0, 5).map((song: Song, idx: number) => (
                    <SongRow
                      key={song.id}
                      song={song}
                      index={idx}
                      songList={results.songs}
                      showAlbum={false}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Artists - placeholder for future enhancement */}
          {(filterCategory === 'all' || filterCategory === 'artists') && results.artists.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-sonora-light uppercase tracking-wider">
                Artists
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {results.artists.map((artist: Artist) => (
                  <div
                    key={artist.id}
                    onClick={() => openArtistDetail(artist)}
                    className="group glass-card p-3 rounded-2xl cursor-pointer flex flex-col items-center text-center active:scale-95 transition-transform"
                  >
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-sonora-elevated mb-2.5 shadow-md">
                      {artist.artworkUri ? (
                        <img src={artist.artworkUri} alt={artist.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sonora-muted">
                          <User className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-sonora-light truncate w-full group-hover:text-sonora-accent">
                      {artist.name}
                    </h4>
                    <p className="text-[10px] text-sonora-muted mt-0.5">Artist</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Albums - placeholder for future enhancement */}
          {(filterCategory === 'all' || filterCategory === 'albums') && results.albums.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-sonora-light uppercase tracking-wider">
                Albums
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {results.albums.map((album: Album) => (
                  <div
                    key={album.id}
                    onClick={() => openAlbumDetail(album)}
                    className="group glass-card p-2.5 rounded-2xl cursor-pointer active:scale-95 transition-transform"
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-sonora-elevated mb-2 shadow-md">
                      {album.artworkUri ? (
                        <img src={album.artworkUri} alt={album.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sonora-muted">
                          <Disc3 className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-sonora-light truncate group-hover:text-sonora-accent">
                      {album.name}
                    </h4>
                    <p className="text-[10px] text-sonora-muted truncate mt-0.5">
                      {album.artist}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Playlists - placeholder for future enhancement */}
          {(filterCategory === 'all' || filterCategory === 'playlists') && results.playlists.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-sonora-light uppercase tracking-wider">
                Playlists
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {results.playlists.map((pl: Playlist) => (
                  <div
                    key={pl.id}
                    onClick={() => openPlaylistDetail({ playlist: pl, songs: [] })}
                    className="group glass-card p-2.5 rounded-2xl cursor-pointer active:scale-95 transition-transform"
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-sonora-elevated mb-2 shadow-md flex items-center justify-center">
                      <ListMusic className="w-10 h-10 text-sonora-accent" />
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-sonora-light truncate group-hover:text-sonora-accent">
                      {pl.name}
                    </h4>
                    <p className="text-[10px] text-sonora-muted truncate mt-0.5">Playlist</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {!hasResults && !isSearching && (
            <div className="py-20 text-center text-sonora-muted space-y-2">
              <p className="text-base font-semibold text-sonora-light">
                No results found for "{searchQuery}"
              </p>
              <p className="text-xs">
                Please check your spelling or search for another song, artist, or album.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Explore / Browse placeholder */
        <div className="py-16 text-center text-sonora-muted space-y-2">
          <Search className="w-12 h-12 mx-auto text-sonora-muted/30 mb-2" />
          <p className="text-base font-semibold text-sonora-light">Search Your Pyracube Collection</p>
          <p className="text-xs max-w-sm mx-auto">
            Find your favorite tracks, artists, albums, and playlists instantly.
          </p>
        </div>
      )}
    </div>
  );
};