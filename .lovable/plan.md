
# "Connected" Social & Alert Ecosystem — Build Plan

## Phase 1: Database Schema (Migration)
- Add `username` and `membership_category` columns to `users_profile`
- Create `user_blocks` table (blocker_id, blocked_id, created_at) with RLS
- Create `social_posts` table (user_id, content, image_url, post_type, created_at) with RLS
- Create `messages` table (sender_id, receiver_id, content, message_type, reference_id, is_read, created_at) with RLS
- Update existing `friend_requests` table if needed for block status

## Phase 2: Profile Enhancements (Settings Page)
- Add Username field and Membership Category dropdown (Annual Passholder, DVC Member, Out of State Traveler) to Settings
- Ensure these persist to `users_profile`

## Phase 3: QR Friendship System (Friends Page)
- Install `react-qr-code` for QR generation and `html5-qrcode` for scanning
- Generate QR from user's existing `qr_token` field
- Add "Scan to Add" button that opens camera scanner
- Add manual code entry fallback
- Scanning creates a friend request (pending → accepted flow)

## Phase 4: Social Discovery Feed (New `/feed` Page)
- Vertical feed showing user posts and admin tips
- "Connect" / "Add Friend" button on each post
- Post creation form (text + optional image URL)
- Block user option on posts
- Add Feed to sidebar navigation

## Phase 5: Friends & Connections Screen (Update Friends Page)
- "My Friends" tab with membership type badges
- "Pending Requests" tab (incoming/outgoing)
- "My QR Code" tab (existing, make functional)
- Show membership category (AP, DVC, Out of State) next to each friend

## Phase 6: Unified Command Inbox (New `/inbox` Page + Header Bell)
- Bell icon in header with unread count badge
- Bell dropdown for quick preview of recent messages
- Full `/inbox` page with thread types:
  - Peer-to-peer messages (friends only)
  - System alerts (dining alerts, event alerts)
  - Magic Beacon alerts (same-park notifications)
- "Book Now" buttons on dining alert threads
- Only friends can message each other

## Navigation Updates
- Add "Feed" to sidebar (with icon)
- Add "Inbox" to sidebar (with unread badge)
- Add bell icon to header

## Libraries to Install
- `react-qr-code` — QR code generation
- `html5-qrcode` — Camera-based QR scanning
