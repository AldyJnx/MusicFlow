import 'package:flutter/material.dart';
import 'package:musicflow_mobile/features/library/screens/biblioteca_screens.dart';
//import 'package:musicflow_mobile/features/library/screens/home_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'MusicFlow',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
      ),
      home: const BibliotecaScreen(),
    );
  }
}
