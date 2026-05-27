import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class WatchlistAlertBanner extends StatelessWidget {
  final String type; // 'plate' | 'face'
  final String matchedValue;
  final String cameraLocation;
  final double confidence;
  final DateTime detectedAt;
  final VoidCallback? onDismiss;

  const WatchlistAlertBanner({
    super.key,
    required this.type,
    required this.matchedValue,
    required this.cameraLocation,
    required this.confidence,
    required this.detectedAt,
    this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    final isPlate = type == 'plate';
    return Container(
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1A0000),
        border: Border.all(color: Colors.red.shade700, width: 2),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.red.withOpacity(0.3), blurRadius: 12, spreadRadius: 2)],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: Colors.red.shade900, shape: BoxShape.circle),
            child: Icon(isPlate ? Icons.directions_car : Icons.face_retouching_natural,
                color: Colors.red.shade300, size: 28),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(
              isPlate ? '🚨 GEMERKTE VOERTUIG BESPEUR' : '🚨 GEMERKTE PERSOON BESPEUR',
              style: TextStyle(color: Colors.red.shade300, fontWeight: FontWeight.bold, fontSize: 12),
            ),
            const SizedBox(height: 4),
            Text(matchedValue,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 4),
            Text('📍 $cameraLocation',
                style: const TextStyle(color: Colors.white70, fontSize: 12)),
            Text(
              '${DateFormat('HH:mm').format(detectedAt)} · ${(confidence * 100).toStringAsFixed(0)}% sekerheid',
              style: const TextStyle(color: Colors.white54, fontSize: 11),
            ),
          ])),
          if (onDismiss != null)
            IconButton(icon: const Icon(Icons.close, color: Colors.white54), onPressed: onDismiss),
        ]),
      ),
    );
  }
}
