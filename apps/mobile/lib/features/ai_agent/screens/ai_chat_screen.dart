import 'package:flutter/material.dart';

class AiChatScreen extends StatefulWidget {
  const AiChatScreen({super.key});

  @override
  State<AiChatScreen> createState() => _AiChatScreenState();
}

class _AiChatScreenState extends State<AiChatScreen> {
  static const Color _accentCyan = Color(0xFF00CFFF);
  static const Color _lightBlue = Color(0xFF4FC3F7);
  static const Color _bgDark = Color(0xFF071A24);
  static const Color _bgMid = Color(0xFF0A2230);
  static const Color _bgTop = Color(0xFF0E3447);
  static const Color _cardSoft = Color(0xFF142631);

  final TextEditingController _controller = TextEditingController();

  final List<_ChatMessage> _messages = [
    const _ChatMessage(
      text: 'Hola, soy Flow. ¿Como quieres que suene tu musica hoy?',
      isUser: false,
      time: '14:01',
      isHero: true,
    ),
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _sendMessage() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.add(
        _ChatMessage(
          text: text,
          isUser: true,
          time: '14:04',
        ),
      );

      _messages.add(
        _ChatMessage(
          text:
              'Entendido. He preparado una respuesta demo para "$text". Puedo sugerirte una mezcla con mas energia, enfoque o ambiente cinematografico segun el mood que busques.',
          isUser: false,
          time: '14:04',
          suggestions: const ['Mas energia', 'Modo enfoque', 'Algo cinematico'],
        ),
      );
    });

    _controller.clear();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: _bgDark,
      bottomNavigationBar: Container(
        margin: const EdgeInsets.fromLTRB(10, 0, 10, 12),
        decoration: BoxDecoration(
          color: const Color(0xFF111A22).withOpacity(0.96),
          borderRadius: BorderRadius.circular(28),
          boxShadow: const [
            BoxShadow(
              color: Color(0x33000000),
              blurRadius: 18,
              offset: Offset(0, 8),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: 3,
          backgroundColor: Colors.transparent,
          elevation: 0,
          selectedItemColor: _accentCyan,
          unselectedItemColor: Colors.white38,
          type: BottomNavigationBarType.fixed,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home_rounded),
              label: 'Inicio',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.library_music_outlined),
              activeIcon: Icon(Icons.library_music_rounded),
              label: 'Biblioteca',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.equalizer_rounded),
              label: 'Ecualizador',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.auto_awesome_outlined),
              activeIcon: Icon(Icons.auto_awesome_rounded),
              label: 'IA',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.workspace_premium_outlined),
              activeIcon: Icon(Icons.workspace_premium_rounded),
              label: 'Premium',
            ),
          ],
        ),
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [_bgTop, _bgMid, _bgDark],
            stops: [0.0, 0.12, 0.42],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                child: Row(
                  children: [
                    Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          colors: [Color(0xFF41312C), Color(0xFF1E1C1B)],
                        ),
                        border: Border.all(
                          color: Colors.white.withOpacity(0.12),
                        ),
                      ),
                      child: const Icon(
                        Icons.person_rounded,
                        size: 20,
                        color: Colors.white70,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'MusicFlow',
                      style: theme.textTheme.headlineSmall?.copyWith(
                        color: _accentCyan,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const Spacer(),
                    const Icon(
                      Icons.workspace_premium_rounded,
                      color: _accentCyan,
                      size: 22,
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.fromLTRB(8, 8, 8, 120),
                  itemCount: _messages.length,
                  itemBuilder: (context, index) {
                    final message = _messages[index];
                    return _MessageBubble(message: message);
                  },
                ),
              ),
            ],
          ),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: Container(
        width: MediaQuery.of(context).size.width - 12,
        margin: const EdgeInsets.symmetric(horizontal: 6),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF2B3138).withOpacity(0.96),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Colors.white.withOpacity(0.05)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x44000000),
              blurRadius: 18,
              offset: Offset(0, 8),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: Row(
            children: [
              const Icon(Icons.mic_none_rounded, color: _lightBlue),
              const SizedBox(width: 10),
              Expanded(
                child: TextField(
                  controller: _controller,
                  cursorColor: _accentCyan,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    hintText: 'Escribe tu comando...',
                    hintStyle: TextStyle(color: Colors.white38),
                    border: InputBorder.none,
                  ),
                  onSubmitted: (_) => _sendMessage(),
                ),
              ),
              GestureDetector(
                onTap: _sendMessage,
                child: Container(
                  width: 44,
                  height: 44,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: _accentCyan,
                    boxShadow: [
                      BoxShadow(
                        color: Color(0x5500CFFF),
                        blurRadius: 14,
                        offset: Offset(0, 4),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.send_rounded,
                    color: _bgDark,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({
    required this.message,
  });

  final _ChatMessage message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final align = message.isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start;
    final margin = message.isUser
        ? const EdgeInsets.fromLTRB(56, 0, 8, 14)
        : const EdgeInsets.fromLTRB(0, 0, 56, 14);

    return Padding(
      padding: margin,
      child: Column(
        crossAxisAlignment: align,
        children: [
          Container(
            width: double.infinity,
            padding: EdgeInsets.fromLTRB(
              message.isHero ? 16 : 18,
              message.isHero ? 16 : 18,
              18,
              18,
            ),
            decoration: BoxDecoration(
              color: message.isUser
                  ? const Color(0xFF2A2F36)
                  : _AiChatScreenState._cardSoft.withOpacity(0.98),
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(28),
                topRight: const Radius.circular(28),
                bottomLeft: Radius.circular(message.isUser ? 28 : 6),
                bottomRight: Radius.circular(message.isUser ? 6 : 28),
              ),
              border: message.isHero
                  ? Border(
                      left: BorderSide(
                        color: _AiChatScreenState._lightBlue,
                        width: 3,
                      ),
                    )
                  : null,
              boxShadow: message.isHero
                  ? const [
                      BoxShadow(
                        color: Color(0x2200CFFF),
                        blurRadius: 18,
                        offset: Offset(0, 8),
                      ),
                    ]
                  : null,
            ),
            child: Column(
              crossAxisAlignment:
                  message.isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                if (!message.isUser && message.isHero) ...[
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.auto_awesome_rounded,
                        color: _AiChatScreenState._lightBlue,
                        size: 14,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'FLOW AI',
                        style: theme.textTheme.labelLarge?.copyWith(
                          color: _AiChatScreenState._lightBlue,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                ],
                Text(
                  message.text,
                  style: (message.isHero
                          ? theme.textTheme.headlineSmall
                          : theme.textTheme.titleLarge)
                      ?.copyWith(
                    color: Colors.white,
                    fontWeight: message.isHero ? FontWeight.w900 : FontWeight.w700,
                    height: 1.3,
                  ),
                ),
                if (message.suggestions.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: message.suggestions
                        .map(
                          (suggestion) => Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(0.24),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              suggestion,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: Colors.white70,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '${message.isUser ? 'ENVIADO' : 'FLOW AI'} · ${message.time}',
            style: theme.textTheme.labelSmall?.copyWith(
              color: message.isUser
                  ? Colors.white54
                  : _AiChatScreenState._lightBlue.withOpacity(0.9),
              letterSpacing: 1,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _ChatMessage {
  const _ChatMessage({
    required this.text,
    required this.isUser,
    required this.time,
    this.isHero = false,
    this.suggestions = const [],
  });

  final String text;
  final bool isUser;
  final String time;
  final bool isHero;
  final List<String> suggestions;
}
