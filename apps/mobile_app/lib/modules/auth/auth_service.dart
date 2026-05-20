// lib/modules/auth/auth_service.dart
import 'dart:convert';
import 'dart:io';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/api/api_client.dart';

class AuthService {
  final ApiClient _apiClient = ApiClient();

  // Función privada para obtener el ID único del hardware
  Future<String> _getDeviceIdentifier() async {
    final deviceInfo = DeviceInfoPlugin();
    if (Platform.isAndroid) {
      final androidInfo = await deviceInfo.androidInfo;
      return androidInfo.id; // ID único de Android
    } else if (Platform.isIOS) {
      final iosInfo = await deviceInfo.iosInfo;
      return iosInfo.identifierForVendor ?? 'unknown_ios_id';
    }
    return 'unknown_device';
  }

  Future<bool> login(String email, String password) async {
    try {
      // 1. Iniciar sesión
      final response = await _apiClient.post('/auth/login', {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final token = data['accessToken'];
        
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('jwt_token', token);

        // 2. 🚀 AHORA REGISTRAMOS EL DISPOSITIVO AUTOMÁTICAMENTE
        final hardwareId = await _getDeviceIdentifier();
        
        // Llamamos al endpoint protegido de NestJS (el token ya se envía por el ApiClient)
        final deviceResponse = await _apiClient.post('/devices/register', {
          'deviceIdentifier': hardwareId,
          'platform': Platform.operatingSystem,
        });

        if (deviceResponse.statusCode == 201) {
          final deviceData = jsonDecode(deviceResponse.body);
          final officialDeviceId = deviceData['id']; // El UUID de PostgreSQL
          
          // Guardamos el UUID oficial en el celular
          await prefs.setString('device_id', officialDeviceId);
          print('✅ Dispositivo registrado con UUID: $officialDeviceId');
        }
        
        return true; 
      }
      return false; 
    } catch (e) {
      print('Error de conexión: $e');
      return false;
    }
  }

  Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.containsKey('jwt_token');
  }
}