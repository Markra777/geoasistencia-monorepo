// lib/core/api/api_client.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  // Si pruebas en el emulador de Android, localhost es 10.0.2.2
  // Si usas un celular físico en la misma red Wi-Fi, pon la IP de tu PC (ej. 192.168.1.X)
  //static const String baseUrl = 'http://192.168.18.17:3000'; 
  static const String baseUrl = 'https://geoasistencia-api.onrender.com';

  // Método auxiliar para obtener el JWT guardado
  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('jwt_token');
    
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // Petición GET genérica
  Future<http.Response> get(String endpoint) async {
    final headers = await _getHeaders();
    final url = Uri.parse('$baseUrl$endpoint');
    return await http.get(url, headers: headers);
  }

  // Petición POST genérica
  Future<http.Response> post(String endpoint, Map<String, dynamic> body) async {
    final headers = await _getHeaders();
    final url = Uri.parse('$baseUrl$endpoint');
    return await http.post(
      url,
      headers: headers,
      body: jsonEncode(body),
    );
  }
}