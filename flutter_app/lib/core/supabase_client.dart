import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseConfig {
  static const url = 'https://oorilcytrytxhffindgy.supabase.co';
  // Anon key is intentionally public — RLS policies protect all data
  static const anonKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vcmlsY3l0cnl0eGhmZmluZGd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MjAzNzYsImV4cCI6MjA4MzI5NjM3Nn0.tc8C2EZDgfg2QrGa5gpf0Zbj4p0m87j_4yK4w3Bi9Ug';
}

SupabaseClient get supabase => Supabase.instance.client;
