import React from 'react';
import { StoriesBar, StoriesBarProps } from './StoriesBar';
import { AdComposer, AdComposerProps } from './AdComposer';
import { PostFeed } from '../PostFeed';
import { BulletinAd } from '../../../server/db/types';

export interface BoardFeedProps {
  // Filters
  isRtl: boolean;
  selectedCity: string;
  selectedRadius: string;
  selectedCities?: string[];
  selectedCountries?: string[];
  setIsLocationFlyoutOpen: (open: boolean) => void;
  handleDetectGpsLocation: () => void;
  isDetectingGps: boolean;
  triggerFeedRefresh: () => void;
  isRefreshing: boolean;

  // Stories
  storiesProps: StoriesBarProps;

  // Composer
  composerProps: AdComposerProps;

  // PostFeed
  ads: BulletinAd[];
  loading: boolean;
  hasMoreAds: boolean;
  loadingMoreAds: boolean;
  handleLoadMoreAds: () => void;
  setActiveReelModalId: (id: number | null) => void;
  setActiveTab: (tab: any) => void;
  searchQuery: string;
  token: string | null;
  user: any;
  handleReportAd: (ad: BulletinAd) => void;
  handleToggleLike: (adId: number) => void;
  toggleComments: (adId: number) => void;
  handleToggleCommentLike: (adId: number, commentId: number, reaction?: string) => void | Promise<void>;
  expandedAdId: number | null;
  commentsMap: Record<number, any[]>;
  loadingCommentsAdId: number | null;
  newCommentText: string;
  setNewCommentText: (text: string) => void;
  handleAddComment: (adId: number) => void;
  replyToCommentId: number | null;
  setReplyToCommentId: (id: number | null) => void;
  handleMessageAdvertiser: (ad: BulletinAd) => void;
  messagingAdId: number | null;
  setInquireAd: (ad: BulletinAd | null) => void;
  handleWhatsAppClick: (ad: BulletinAd, e?: any) => void;
  handleShareAd: (ad: BulletinAd) => void;
  handleOpenPageDetail: (pageId: number) => void;
  handleOpenUserDetail?: (userId: number) => void;
  handleOpenLightbox: (...args: any[]) => void;
  openPostUploadModal: () => void;
  handleOpenBoostModal: (ad: BulletinAd) => void;
  handleEditAd: (ad: BulletinAd) => void;
  handleDeleteAd: (ad: BulletinAd) => void | Promise<void>;
  handleToggleSave: (ad: BulletinAd) => void;
  setAds: React.Dispatch<React.SetStateAction<BulletinAd[]>>;
  setSavedAds: React.Dispatch<React.SetStateAction<BulletinAd[]>>;
}

export const BoardFeed: React.FC<BoardFeedProps> = ({
  isRtl,
  selectedCity,
  selectedRadius,
  selectedCities = [],
  selectedCountries = [],
  setIsLocationFlyoutOpen,
  handleDetectGpsLocation,
  isDetectingGps,
  triggerFeedRefresh,
  isRefreshing,
  storiesProps,
  composerProps,
  ads,
  loading,
  hasMoreAds,
  loadingMoreAds,
  handleLoadMoreAds,
  setActiveReelModalId,
  setActiveTab,
  searchQuery,
  token,
  user,
  handleReportAd,
  handleToggleLike,
  toggleComments,
  handleToggleCommentLike,
  expandedAdId,
  commentsMap,
  loadingCommentsAdId,
  newCommentText,
  setNewCommentText,
  handleAddComment,
  replyToCommentId,
  setReplyToCommentId,
  handleMessageAdvertiser,
  messagingAdId,
  setInquireAd,
  handleWhatsAppClick,
  handleShareAd,
  handleOpenPageDetail,
  handleOpenUserDetail,
  handleOpenLightbox,
  openPostUploadModal,
  handleOpenBoostModal,
  handleEditAd,
  handleDeleteAd,
  handleToggleSave,
  setAds,
  setSavedAds,
}) => {
  return (
    <div className="space-y-3 sm:space-y-5">
      {/* Stories / Reels Highlights Carousel Bar with Integrated City Selector */}
      <StoriesBar
        {...storiesProps}
        selectedCity={selectedCity}
        selectedRadius={selectedRadius}
        selectedCities={selectedCities}
        selectedCountries={selectedCountries}
        setIsLocationFlyoutOpen={setIsLocationFlyoutOpen}
      />

      {/* Facebook Post Creation Bar (Composer Box) */}
      <AdComposer {...composerProps} />

      {/* Ads Feed Grid */}
      <PostFeed
        ads={ads}
        loading={loading}
        hasMore={hasMoreAds}
        loadingMore={loadingMoreAds}
        onLoadMore={handleLoadMoreAds}
        onRefresh={triggerFeedRefresh}
        isRefreshing={isRefreshing}
        onOpenReelFeed={(adId) => {
          if (adId) {
            setActiveReelModalId(adId);
          } else {
            setActiveTab('reels');
          }
        }}
        isRtl={isRtl}
        token={token}
        user={user}
        searchQuery={searchQuery}
        onReportAd={handleReportAd}
        onToggleLike={handleToggleLike}
        onToggleComments={toggleComments}
        onToggleCommentLike={handleToggleCommentLike}
        expandedAdId={expandedAdId}
        commentsMap={commentsMap}
        loadingCommentsAdId={loadingCommentsAdId}
        newCommentText={newCommentText}
        setNewCommentText={setNewCommentText}
        onAddComment={handleAddComment}
        replyToCommentId={replyToCommentId}
        setReplyToCommentId={setReplyToCommentId}
        onMessageAdvertiser={handleMessageAdvertiser}
        messagingAdId={messagingAdId}
        onInquire={setInquireAd}
        onWhatsApp={handleWhatsAppClick}
        onShare={handleShareAd}
        onOpenPageDetail={handleOpenPageDetail}
        onOpenUserDetail={handleOpenUserDetail}
        onOpenLightbox={handleOpenLightbox}
        onCreateAdClick={openPostUploadModal}
        onBoostAd={handleOpenBoostModal}
        onEditAd={handleEditAd}
        onDeleteAd={handleDeleteAd}
        onToggleSave={handleToggleSave}
        onArchiveAd={(archivedAd) => {
          setAds((prev) => prev.filter((a) => a.id !== archivedAd.id));
          setSavedAds((prev) => prev.filter((a) => a.id !== archivedAd.id));
        }}
        onTrashAd={(trashedAd) => {
          setAds((prev) => prev.filter((a) => a.id !== trashedAd.id));
          setSavedAds((prev) => prev.filter((a) => a.id !== trashedAd.id));
        }}
        onUpdateAd={(updatedAd) => {
          setAds((prev) => prev.map((a) => (a.id === updatedAd.id ? { ...a, ...updatedAd } : a)));
          setSavedAds((prev) => prev.map((a) => (a.id === updatedAd.id ? { ...a, ...updatedAd } : a)));
        }}
      />
    </div>
  );
};
