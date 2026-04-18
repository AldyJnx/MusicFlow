class User {
  final String id;
  final String email;
  final String username;
  final String role;
  final bool isPremium;
  final String? avatar;

  User({
    required this.id,
    required this.email,
    required this.username,
    required this.role,
    required this.isPremium,
    this.avatar,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      username: json['username'] as String,
      role: json['role'] as String,
      isPremium: json['is_premium'] as bool,
      avatar: json['avatar'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'username': username,
      'role': role,
      'is_premium': isPremium,
      'avatar': avatar,
    };
  }

  bool get isAdmin => role == 'admin';
}
