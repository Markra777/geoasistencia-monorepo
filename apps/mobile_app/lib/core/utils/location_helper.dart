// lib/core/utils/location_helper.dart
import 'package:geolocator/geolocator.dart';

class LocationHelper {
  // Obtiene la ubicación actual validando permisos [cite: 230]
  static Future<Position?> getCurrentLocation() async {
    bool serviceEnabled;
    LocationPermission permission;

    // 1. Validar si el servicio de GPS está encendido en el celular
    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw Exception('El servicio de GPS está desactivado.');
    }

    // 2. Validar los permisos de la app
    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        throw Exception('Los permisos de ubicación fueron denegados.');
      }
    }
    
    if (permission == LocationPermission.deniedForever) {
      throw Exception('Los permisos de ubicación están denegados permanentemente. Actívalos en configuración.');
    } 

    // 3. Obtener la posición con alta precisión
    return await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high, // RN-16: Alta precisión
    );
  }
}