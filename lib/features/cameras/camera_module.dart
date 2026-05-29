// Dorpie Camera Integration — powered by vcds-watchlist-engine
// Drop-in module — import this file and add CameraTab to your nav
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vcds_watchlist_engine/vcds_watchlist_engine.dart';

export 'package:vcds_watchlist_engine/vcds_watchlist_engine.dart'
    show CameraManagementScreen, CameraAlertsScreen;

/// Register this in your app's ProviderScope overrides:
/// cameraApiServiceProvider.overrideWithValue(
///   CameraApiService(baseUrl: yourApiUrl, appContext: 'dorpie'),
/// )
const dorpieAccent = Color(0xFF1565C0); // Dorpie blue
