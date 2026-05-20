// lib/modules/attendance/check_in_out_screen.dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:signature/signature.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/utils/location_helper.dart';
import 'package:uuid/uuid.dart';
import '../../core/api/api_client.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/utils/cloudinary_helper.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

class CheckInOutScreen extends StatefulWidget {
  final String type; // 'Entrada' o 'Salida'

  const CheckInOutScreen({super.key, required this.type});

  @override
  State<CheckInOutScreen> createState() => _CheckInOutScreenState();
}

class _CheckInOutScreenState extends State<CheckInOutScreen> {
  Position? _position;
  File? _photoFile;
  bool _isLoading = false;

  // 🚀 NUEVO: Controlador para el texto de comentarios
  final _commentsController = TextEditingController();

  // Controlador para el lienzo (canvas) de la firma
  final SignatureController _signatureController = SignatureController(
    penStrokeWidth: 3,
    penColor: Colors.black,
    exportBackgroundColor: Colors.white,
  );

  @override
  void initState() {
    super.initState();
    _fetchLocation(); // Obtenemos el GPS automáticamente al entrar a la pantalla
  }

  Future<void> _fetchLocation() async {
    try {
      final position = await LocationHelper.getCurrentLocation();
      setState(() => _position = position);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error GPS: $e'), backgroundColor: Colors.red),
      );
    }
  }

  // Método para abrir la cámara y capturar la foto
  Future<void> _takePhoto() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(
      source: ImageSource.camera,
      preferredCameraDevice:
          CameraDevice.front, // Preferimos la cámara frontal (selfie)
      imageQuality: 70, // Reducimos calidad para que suba rápido
    );

    if (pickedFile != null) {
      setState(() {
        _photoFile = File(pickedFile.path);
      });
    }
  }

  Future<void> _submitAttendance() async {
    if (_position == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Esperando ubicación GPS...')),
      );
      return;
    }
    if (_photoFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Debes tomar una foto de evidencia.')),
      );
      return;
    }
    if (_signatureController.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Debes dibujar tu firma.')));
      return;
    }

    setState(() => _isLoading = true);

    try {
      // 1. Convertimos la firma a bytes
      final signatureBytes = await _signatureController.toPngBytes();

      if (signatureBytes == null) throw Exception('Error procesando la firma.');

      // 2. SUBIMOS A CLOUDINARY (El Backend ni se entera de esto)
      final photoUrl = await CloudinaryHelper.uploadImagePath(_photoFile!.path);
      final signatureUrl = await CloudinaryHelper.uploadSignatureBytes(
        signatureBytes,
      );

      if (photoUrl == null || signatureUrl == null) {
        throw Exception('Fallo al subir imágenes a la nube.');
      }

      // 3. Obtenemos datos locales (ID del hardware y tiempo)
      final prefs = await SharedPreferences.getInstance();
      final deviceId = prefs.getString('device_id');
      if (deviceId == null)
        throw Exception('Dispositivo no registrado. Inicia sesión nuevamente.');

      final now = DateTime.now();
      final uuid = const Uuid().v4();
      final apiClient = ApiClient();

      // 4. CREAMOS EL PAYLOAD (¡Ahora con URLs reales públicas!)
      final payload = {
        "id": uuid,
        "localDateTime": now.toIso8601String(),
        "utcDateTime": now.toUtc().toIso8601String(),
        "latitude": _position!.latitude,
        "longitude": _position!.longitude,
        "accuracy": _position!.accuracy,
        "signatureUrl":
            signatureUrl, // Ej: https://res.cloudinary.com/.../firma.png
        "photoUrl": photoUrl, // Ej: https://res.cloudinary.com/.../foto.jpg
        "deviceId": deviceId,
        "comments": _commentsController.text.trim().isEmpty ? null : _commentsController.text.trim() // 🚀 NUEVO
      };

      // 5. ENVIAMOS EL JSON LIMPIO A NESTJS
      final endpoint = widget.type == 'Entrada'
          ? '/attendance/check-in'
          : '/attendance/check-out';
      final response = await apiClient.post(endpoint, payload);

      setState(() => _isLoading = false);

      if (response.statusCode == 201) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('¡${widget.type} registrada con éxito!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${response.body}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  void dispose() {
    _commentsController.dispose();
    _signatureController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Registrar ${widget.type}')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. Estado del GPS
              // 1. Estado del GPS (Ahora con Mapa Visual)
              const Text(
                'Tu Ubicación Actual',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 8),
              Container(
                height: 200, // Altura del mapa
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade300, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: _position != null
                      ? FlutterMap(
                          options: MapOptions(
                            // Centramos el mapa en las coordenadas capturadas
                            initialCenter: LatLng(
                              _position!.latitude,
                              _position!.longitude,
                            ),
                            initialZoom:
                                16.0, // Nivel de zoom cercano a las calles
                          ),
                          children: [
                            TileLayer(
                              // Capa visual gratuita de OpenStreetMap
                              urlTemplate:
                                  'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                              userAgentPackageName: 'com.markra.asistencia',
                            ),
                            MarkerLayer(
                              markers: [
                                Marker(
                                  point: LatLng(
                                    _position!.latitude,
                                    _position!.longitude,
                                  ),
                                  width: 50,
                                  height: 50,
                                  child: const Icon(
                                    Icons.location_on,
                                    color: Colors.red,
                                    size: 45,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        )
                      : const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              CircularProgressIndicator(),
                              SizedBox(height: 8),
                              Text('Obteniendo ubicación GPS...'),
                            ],
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 8),
              // Mostramos la precisión debajo del mapa para cumplir la RN-16
              if (_position != null)
                Text(
                  'Precisión del radar: ${_position!.accuracy.toStringAsFixed(1)} metros',
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                  textAlign: TextAlign.center,
                ),
              const SizedBox(height: 16),
              const Divider(),

              // 2. Foto de evidencia
              const Text(
                'Foto de Evidencia',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: _takePhoto,
                child: Container(
                  height: 200,
                  decoration: BoxDecoration(
                    color: Colors.grey[200],
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey),
                  ),
                  child: _photoFile != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.file(_photoFile!, fit: BoxFit.cover),
                        )
                      : const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.camera_alt,
                              size: 48,
                              color: Colors.grey,
                            ),
                            Text('Tocar para abrir cámara'),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 16),
              const Divider(),

              // 3. Firma (RN-11)
              const Text(
                'Firma Digital',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 8),
              Container(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.blueAccent),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Signature(
                    controller: _signatureController,
                    height: 150,
                    backgroundColor: Colors.grey[100]!,
                  ),
                ),
              ),
              TextButton(
                onPressed: () => _signatureController.clear(),
                child: const Text('Limpiar firma'),
              ),
              const SizedBox(height: 16),
              const Divider(),

              // 🚀 NUEVO: Campo de texto para Comentarios / Justificación
              const Text(
                'Comentarios u Observaciones (Opcional)',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _commentsController,
                maxLines: 3, // Caja de texto multilínea espaciosa
                maxLength: 250, // Límite de caracteres razonable
                decoration: InputDecoration(
                  hintText:
                      'Ej. Retraso debido a congestión vehicular por accidente...',
                  hintStyle: TextStyle(
                    color: Colors.grey.shade400,
                    fontSize: 14,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  prefixIcon: const Icon(Icons.comment, color: Colors.grey),
                ),
              ),
              const SizedBox(height: 24),

              // 4. Botón de envío
              ElevatedButton(
                onPressed: _isLoading ? null : _submitAttendance,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: widget.type == 'Entrada'
                      ? Colors.green
                      : Colors.orange,
                  foregroundColor: Colors.white,
                ),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text(
                        'ENVIAR ${widget.type.toUpperCase()}',
                        style: const TextStyle(fontSize: 16),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
