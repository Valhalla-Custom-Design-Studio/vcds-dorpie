import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/auth_service.dart';
import '../core/constants.dart';

class WatchlistEntry {
  final String id;
  final String value; // plate number OR face label
  final String type; // 'plate' | 'face'
  final String threat;
  final String reason;
  final String? imageUrl;
  final DateTime createdAt;

  WatchlistEntry({
    required this.id,
    required this.value,
    required this.type,
    required this.threat,
    required this.reason,
    this.imageUrl,
    required this.createdAt,
  });

  factory WatchlistEntry.fromJson(Map<String, dynamic> j, String type) => WatchlistEntry(
        id: j['id'].toString(),
        value: type == 'plate' ? j['plate_number'] : j['label'],
        type: type,
        threat: j['threat_level'] ?? 'medium',
        reason: j['reason'] ?? '',
        imageUrl: j['image_url'],
        createdAt: DateTime.tryParse(j['created_at'] ?? '') ?? DateTime.now(),
      );
}

class WatchlistEvent {
  final String id;
  final String type;
  final String matchedValue;
  final String cameraId;
  final double confidence;
  final DateTime detectedAt;

  WatchlistEvent({
    required this.id,
    required this.type,
    required this.matchedValue,
    required this.cameraId,
    required this.confidence,
    required this.detectedAt,
  });

  factory WatchlistEvent.fromJson(Map<String, dynamic> j) => WatchlistEvent(
        id: j['id'].toString(),
        type: j['detection_type'] ?? 'plate',
        matchedValue: j['matched_value'] ?? '',
        cameraId: j['camera_id']?.toString() ?? '',
        confidence: (j['confidence_score'] ?? 0).toDouble(),
        detectedAt: DateTime.tryParse(j['detected_at'] ?? '') ?? DateTime.now(),
      );
}

class WatchlistService {
  static final _base = AppConstants.apiBaseUrl;

  static Future<Map<String, String>> _headers() async {
    final token = await AuthService.getToken();
    return {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'};
  }

  // ── Plates ──────────────────────────────────────────────────────────────────
  static Future<List<WatchlistEntry>> getPlates() async {
    final r = await http.get(Uri.parse('$_base/watchlist/plates'), headers: await _headers());
    if (r.statusCode != 200) throw Exception('Kon nie laai nie');
    final List data = json.decode(r.body);
    return data.map((j) => WatchlistEntry.fromJson(j, 'plate')).toList();
  }

  static Future<void> addPlate({
    required String plateNumber,
    required String threatLevel,
    required String reason,
  }) async {
    final r = await http.post(
      Uri.parse('$_base/watchlist/plates'),
      headers: await _headers(),
      body: json.encode({'plate_number': plateNumber, 'threat_level': threatLevel, 'reason': reason}),
    );
    if (r.statusCode != 200 && r.statusCode != 201) throw Exception('Kon nie byvoeg nie');
  }

  static Future<void> deletePlate(String id) async {
    final r = await http.delete(Uri.parse('$_base/watchlist/plates/$id'), headers: await _headers());
    if (r.statusCode != 200) throw Exception('Kon nie verwyder nie');
  }

  // ── Faces ───────────────────────────────────────────────────────────────────
  static Future<List<WatchlistEntry>> getFaces() async {
    final r = await http.get(Uri.parse('$_base/watchlist/faces'), headers: await _headers());
    if (r.statusCode != 200) throw Exception('Kon nie laai nie');
    final List data = json.decode(r.body);
    return data.map((j) => WatchlistEntry.fromJson(j, 'face')).toList();
  }

  static Future<void> addFace({
    required String label,
    required String threatLevel,
    required String reason,
    String? imageUrl,
  }) async {
    final r = await http.post(
      Uri.parse('$_base/watchlist/faces'),
      headers: await _headers(),
      body: json.encode({'label': label, 'threat_level': threatLevel, 'reason': reason, 'image_url': imageUrl}),
    );
    if (r.statusCode != 200 && r.statusCode != 201) throw Exception('Kon nie byvoeg nie');
  }

  static Future<void> deleteFace(String id) async {
    final r = await http.delete(Uri.parse('$_base/watchlist/faces/$id'), headers: await _headers());
    if (r.statusCode != 200) throw Exception('Kon nie verwyder nie');
  }

  // ── Events ──────────────────────────────────────────────────────────────────
  static Future<List<WatchlistEvent>> getEvents({int limit = 50}) async {
    final r = await http.get(Uri.parse('$_base/watchlist/events?limit=$limit'), headers: await _headers());
    if (r.statusCode != 200) throw Exception('Kon nie laai nie');
    final List data = json.decode(r.body);
    return data.map((j) => WatchlistEvent.fromJson(j)).toList();
  }
}
