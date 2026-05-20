// lib/core/utils/cloudinary_helper.dart
import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

class CloudinaryHelper {
  // ⚠️ REEMPLAZA ESTOS DOS VALORES CON LOS TUYOS
  static const String cloudName = 'dqyovyhtm'; 
  static const String uploadPreset = 'asistencia_app'; // El preset Unsigned que creaste

  // Método para subir la foto de la cámara (File path)
  static Future<String?> uploadImagePath(String imagePath) async {
    return _upload(
      await http.MultipartFile.fromPath('file', imagePath, contentType: MediaType('image', 'jpeg')),
    );
  }

  // Método para subir la firma digital (Bytes)
  static Future<String?> uploadSignatureBytes(Uint8List signatureBytes) async {
    return _upload(
      http.MultipartFile.fromBytes('file', signatureBytes, filename: 'firma.png', contentType: MediaType('image', 'png')),
    );
  }

  // Lógica central de subida
  static Future<String?> _upload(http.MultipartFile file) async {
    final uri = Uri.parse('https://api.cloudinary.com/v1_1/$cloudName/image/upload');
    final request = http.MultipartRequest('POST', uri)
      ..fields['upload_preset'] = uploadPreset
      ..files.add(file);

    final response = await request.send();

    if (response.statusCode == 200) {
      final responseData = await response.stream.toBytes();
      final responseString = String.fromCharCodes(responseData);
      final jsonMap = jsonDecode(responseString);
      return jsonMap['secure_url']; // Esta es la URL final optimizada (https://...)
    } else {
      print('Error al subir a Cloudinary: ${response.statusCode}');
      return null;
    }
  }
}