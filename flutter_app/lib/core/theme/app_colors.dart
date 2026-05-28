import 'package:flutter/material.dart';

abstract class AppColors {
  // Parchment — cream/off-white
  static const parchment50 = Color(0xFFFDF8F0);
  static const parchment100 = Color(0xFFF7EED8);
  static const parchment200 = Color(0xFFECDCB8);
  static const parchment300 = Color(0xFFDDC898);
  static const parchment400 = Color(0xFFC9AE78);

  // Forest — deep green (primary)
  static const forest50 = Color(0xFFEDF4ED);
  static const forest100 = Color(0xFFC8DFC8);
  static const forest200 = Color(0xFF94BF94);
  static const forest300 = Color(0xFF5D9560);
  static const forest400 = Color(0xFF3A7040);
  static const forest500 = Color(0xFF245230);
  static const forest600 = Color(0xFF163720);
  static const forest700 = Color(0xFF0B2014);

  // Sky — teal
  static const sky50 = Color(0xFFEAF4F4);
  static const sky100 = Color(0xFFBFE0E0);
  static const sky200 = Color(0xFF87C4C4);
  static const sky300 = Color(0xFF52A5A5);
  static const sky400 = Color(0xFF2E8282);
  static const sky500 = Color(0xFF1A5F5F);
  static const sky600 = Color(0xFF0D3E3E);

  // Clay — terracotta (secondary/error-adjacent)
  static const clay50 = Color(0xFFFDF2EC);
  static const clay100 = Color(0xFFF5D5BC);
  static const clay200 = Color(0xFFE8AA80);
  static const clay300 = Color(0xFFD47D4A);
  static const clay400 = Color(0xFFB85C28);
  static const clay500 = Color(0xFF8F3E14);
  static const clay600 = Color(0xFF5E2509);

  // Wheat — golden (favorites/stars)
  static const wheat50 = Color(0xFFFEFAEE);
  static const wheat100 = Color(0xFFF9EDBC);
  static const wheat200 = Color(0xFFF0D57A);
  static const wheat300 = Color(0xFFE2B83A);
  static const wheat400 = Color(0xFFC49018);
  static const wheat500 = Color(0xFF8E640A);
  static const wheat600 = Color(0xFF5C3E03);

  // Plum — purple (shared/friends)
  static const plum50 = Color(0xFFF5EEF8);
  static const plum100 = Color(0xFFDFC7EA);
  static const plum200 = Color(0xFFBF95D4);
  static const plum300 = Color(0xFF9A62B8);
  static const plum400 = Color(0xFF74389A);
  static const plum500 = Color(0xFF4F1F72);
  static const plum600 = Color(0xFF2E0D46);

  // Ink — dark neutrals (text)
  static const ink50 = Color(0xFFECE9E3);
  static const ink100 = Color(0xFFC9C2B4);
  static const ink200 = Color(0xFF9E9180);
  static const ink300 = Color(0xFF7A6E5C);
  static const ink400 = Color(0xFF574E3E);
  static const ink500 = Color(0xFF352E22);
  static const ink600 = Color(0xFF1A1610);

  // Aliases
  static const cream = parchment50;
  static const warmGray = ink300;
}
