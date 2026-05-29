import { Redirect } from 'expo-router';

/**
 * Marketplace messages entry — redirects to inbox.
 * Covers: buyer/seller chat, offer negotiations, transaction confirmations.
 */
export default function MarketplaceMessagesRedirect() {
  return <Redirect href="/(tabs)/marketplace/messages/inbox" />;
}
