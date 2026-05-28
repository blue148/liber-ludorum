import 'profile.dart';

class UserFriend {
  final String id;
  final String userId;
  final String friendId;
  final String status; // 'pending' | 'accepted' | 'blocked'
  final AppProfile? friend;
  final DateTime createdAt;
  final DateTime updatedAt;

  const UserFriend({
    required this.id,
    required this.userId,
    required this.friendId,
    required this.status,
    this.friend,
    required this.createdAt,
    required this.updatedAt,
  });

  factory UserFriend.fromJson(Map<String, dynamic> json) => UserFriend(
        id: json['id'] as String,
        userId: json['user_id'] as String,
        friendId: json['friend_id'] as String,
        status: json['status'] as String,
        friend: json['friend'] != null
            ? AppProfile.fromJson(json['friend'] as Map<String, dynamic>)
            : null,
        createdAt: DateTime.parse(json['created_at'] as String),
        updatedAt: DateTime.parse(json['updated_at'] as String),
      );
}

class SharedLibraryAccess {
  final String id;
  final String ownerId;
  final String viewerId;
  final String accessLevel; // 'view' | 'suggest'
  final AppProfile? owner;
  final DateTime createdAt;

  const SharedLibraryAccess({
    required this.id,
    required this.ownerId,
    required this.viewerId,
    required this.accessLevel,
    this.owner,
    required this.createdAt,
  });

  factory SharedLibraryAccess.fromJson(Map<String, dynamic> json) =>
      SharedLibraryAccess(
        id: json['id'] as String,
        ownerId: json['owner_id'] as String,
        viewerId: json['viewer_id'] as String,
        accessLevel: json['access_level'] as String,
        owner: json['owner'] != null
            ? AppProfile.fromJson(json['owner'] as Map<String, dynamic>)
            : null,
        createdAt: DateTime.parse(json['created_at'] as String),
      );
}
