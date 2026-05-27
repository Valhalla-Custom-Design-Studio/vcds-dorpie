import React from 'react';
import { Stack } from 'expo-router';
import WatchlistAdminScreen from '../../lib/screens/admin/watchlist_admin_screen';

export default function WatchlistAdminRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Waglyslys Bestuur', headerBackTitle: 'Admin' }} />
      <WatchlistAdminScreen />
    </>
  );
}
