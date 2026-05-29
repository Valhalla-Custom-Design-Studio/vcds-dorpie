import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/watchlist_service.dart';

class WatchlistAdminScreen extends StatefulWidget {
  const WatchlistAdminScreen({super.key});

  @override
  State<WatchlistAdminScreen> createState() => _WatchlistAdminScreenState();
}

class _WatchlistAdminScreenState extends State<WatchlistAdminScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  List<WatchlistEntry> _plates = [];
  List<WatchlistEntry> _faces = [];
  List<WatchlistEvent> _events = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final results = await Future.wait([
        WatchlistService.getPlates(),
        WatchlistService.getFaces(),
        WatchlistService.getEvents(),
      ]);
      setState(() {
        _plates = results[0] as List<WatchlistEntry>;
        _faces = results[1] as List<WatchlistEntry>;
        _events = results[2] as List<WatchlistEvent>;
        _loading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Color _threatColor(String t) {
    switch (t) {
      case 'critical': return Colors.red.shade700;
      case 'high': return Colors.orange.shade700;
      case 'medium': return Colors.amber.shade700;
      default: return Colors.green.shade700;
    }
  }

  String _threatLabel(String t) {
    switch (t) {
      case 'critical': return 'KRITIEK';
      case 'high': return 'HOOG';
      case 'medium': return 'MEDIUM';
      default: return 'LAAG';
    }
  }

  Future<void> _addPlateDialog() async {
    final plateCtrl = TextEditingController();
    final reasonCtrl = TextEditingController();
    String threat = 'high';
    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A2E),
        title: const Text('Voeg Nommer Plaat By', style: TextStyle(color: Colors.white)),
        content: StatefulBuilder(builder: (ctx, ss) => Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: plateCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: _inputDeco('Nommer Plaat (bv. CA 123-456)'),
              textCapitalization: TextCapitalization.characters,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: threat,
              dropdownColor: const Color(0xFF1A1A2E),
              style: const TextStyle(color: Colors.white),
              decoration: _inputDeco('Dreigingsvlak'),
              items: ['low','medium','high','critical'].map((v) => DropdownMenuItem(
                value: v, child: Text(_threatLabel(v), style: const TextStyle(color: Colors.white)),
              )).toList(),
              onChanged: (v) => ss(() => threat = v!),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: _inputDeco('Rede / Beskrywing'),
              maxLines: 2,
            ),
          ],
        )),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Kanselleer')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red.shade700),
            onPressed: () async {
              if (plateCtrl.text.trim().isEmpty) return;
              Navigator.pop(ctx);
              try {
                await WatchlistService.addPlate(
                  plateNumber: plateCtrl.text.trim().toUpperCase(),
                  threatLevel: threat,
                  reason: reasonCtrl.text.trim(),
                );
                _load();
              } catch (e) {
                _showError(e.toString());
              }
            },
            child: const Text('Voeg By'),
          ),
        ],
      ),
    );
  }

  Future<void> _addFaceDialog() async {
    final labelCtrl = TextEditingController();
    final reasonCtrl = TextEditingController();
    final imageCtrl = TextEditingController();
    String threat = 'high';
    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A2E),
        title: const Text('Voeg Gesig By', style: TextStyle(color: Colors.white)),
        content: StatefulBuilder(builder: (ctx, ss) => Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: labelCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: _inputDeco('Naam / Beskrywing'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: threat,
              dropdownColor: const Color(0xFF1A1A2E),
              style: const TextStyle(color: Colors.white),
              decoration: _inputDeco('Dreigingsvlak'),
              items: ['low','medium','high','critical'].map((v) => DropdownMenuItem(
                value: v, child: Text(_threatLabel(v), style: const TextStyle(color: Colors.white)),
              )).toList(),
              onChanged: (v) => ss(() => threat = v!),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: imageCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: _inputDeco('Foto URL (opsioneel)'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: _inputDeco('Rede / Beskrywing'),
              maxLines: 2,
            ),
          ],
        )),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Kanselleer')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red.shade700),
            onPressed: () async {
              if (labelCtrl.text.trim().isEmpty) return;
              Navigator.pop(ctx);
              try {
                await WatchlistService.addFace(
                  label: labelCtrl.text.trim(),
                  threatLevel: threat,
                  reason: reasonCtrl.text.trim(),
                  imageUrl: imageCtrl.text.trim().isEmpty ? null : imageCtrl.text.trim(),
                );
                _load();
              } catch (e) {
                _showError(e.toString());
              }
            },
            child: const Text('Voeg By'),
          ),
        ],
      ),
    );
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg), backgroundColor: Colors.red.shade700,
    ));
  }

  InputDecoration _inputDeco(String label) => InputDecoration(
    labelText: label,
    labelStyle: const TextStyle(color: Colors.white54),
    enabledBorder: const OutlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
    focusedBorder: const OutlineInputBorder(borderSide: BorderSide(color: Colors.orange)),
  );

  Widget _threatBadge(String t) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
    decoration: BoxDecoration(color: _threatColor(t), borderRadius: BorderRadius.circular(4)),
    child: Text(_threatLabel(t), style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
  );

  Widget _platesTab() => RefreshIndicator(
    onRefresh: _load,
    child: ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: _plates.length,
      itemBuilder: (ctx, i) {
        final p = _plates[i];
        return Card(
          color: const Color(0xFF1A1A2E),
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: const Icon(Icons.directions_car, color: Colors.orange),
            title: Text(p.value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
            subtitle: Text(p.reason, style: const TextStyle(color: Colors.white54)),
            trailing: Row(mainAxisSize: MainAxisSize.min, children: [
              _threatBadge(p.threat),
              const SizedBox(width: 8),
              IconButton(
                icon: const Icon(Icons.delete_outline, color: Colors.red),
                onPressed: () async {
                  final ok = await _confirmDelete('Verwyder ${p.value}?');
                  if (ok) {
                    await WatchlistService.deletePlate(p.id);
                    _load();
                  }
                },
              ),
            ]),
          ),
        );
      },
    ),
  );

  Widget _facesTab() => RefreshIndicator(
    onRefresh: _load,
    child: ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: _faces.length,
      itemBuilder: (ctx, i) {
        final f = _faces[i];
        return Card(
          color: const Color(0xFF1A1A2E),
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: f.imageUrl != null
                ? CircleAvatar(backgroundImage: NetworkImage(f.imageUrl!))
                : const CircleAvatar(child: Icon(Icons.person, color: Colors.white), backgroundColor: Colors.grey),
            title: Text(f.value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            subtitle: Text(f.reason, style: const TextStyle(color: Colors.white54)),
            trailing: Row(mainAxisSize: MainAxisSize.min, children: [
              _threatBadge(f.threat),
              const SizedBox(width: 8),
              IconButton(
                icon: const Icon(Icons.delete_outline, color: Colors.red),
                onPressed: () async {
                  final ok = await _confirmDelete('Verwyder ${f.value}?');
                  if (ok) {
                    await WatchlistService.deleteFace(f.id);
                    _load();
                  }
                },
              ),
            ]),
          ),
        );
      },
    ),
  );

  Widget _eventsTab() => RefreshIndicator(
    onRefresh: _load,
    child: ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: _events.length,
      itemBuilder: (ctx, i) {
        final e = _events[i];
        final isPlate = e.type == 'plate';
        return Card(
          color: const Color(0xFF1A1A2E),
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: Icon(
              isPlate ? Icons.directions_car : Icons.face,
              color: e.confidence > 0.85 ? Colors.red : Colors.orange,
            ),
            title: Text(
              e.matchedValue,
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
            subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Kamera: ${e.cameraId}', style: const TextStyle(color: Colors.white54, fontSize: 12)),
              Text(
                DateFormat('dd MMM yyyy HH:mm').format(e.detectedAt.toLocal()),
                style: const TextStyle(color: Colors.white38, fontSize: 11),
              ),
            ]),
            trailing: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: e.confidence > 0.85 ? Colors.red.shade900 : Colors.orange.shade900,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                '${(e.confidence * 100).toStringAsFixed(0)}%',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        );
      },
    ),
  );

  Future<bool> _confirmDelete(String msg) async {
    return await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A2E),
        title: const Text('Bevestig', style: TextStyle(color: Colors.white)),
        content: Text(msg, style: const TextStyle(color: Colors.white70)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Nee')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Ja, Verwyder'),
          ),
        ],
      ),
    ) ?? false;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D0D1A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A2E),
        title: const Text('Waglys Bestuur', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
        bottom: TabBar(
          controller: _tabs,
          indicatorColor: Colors.orange,
          labelColor: Colors.orange,
          unselectedLabelColor: Colors.white54,
          tabs: [
            Tab(text: 'Plaatnommers (${_plates.length})'),
            Tab(text: 'Gesigte (${_faces.length})'),
            Tab(text: 'Gebeure (${_events.length})'),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.refresh, color: Colors.white), onPressed: _load),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Colors.orange))
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
              : TabBarView(
                  controller: _tabs,
                  children: [_platesTab(), _facesTab(), _eventsTab()],
                ),
      floatingActionButton: AnimatedBuilder(
        animation: _tabs,
        builder: (ctx, _) {
          if (_tabs.index == 2) return const SizedBox.shrink();
          return FloatingActionButton.extended(
            backgroundColor: Colors.red.shade700,
            icon: const Icon(Icons.add),
            label: Text(_tabs.index == 0 ? 'Voeg Plaat By' : 'Voeg Gesig By'),
            onPressed: _tabs.index == 0 ? _addPlateDialog : _addFaceDialog,
          );
        },
      ),
    );
  }
}
