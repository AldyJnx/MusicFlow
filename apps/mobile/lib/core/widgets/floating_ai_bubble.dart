import 'package:flutter/material.dart';

class FloatingAIBubble extends StatefulWidget {
  const FloatingAIBubble({
    super.key,
    required this.boundsSize,
    this.onTap,
    this.icon = Icons.smart_toy_rounded,
    this.size = 58,
    this.showIndicator = true,
    this.padding = const EdgeInsets.all(16),
  });

  final Size boundsSize;
  final VoidCallback? onTap;
  final IconData icon;
  final double size;
  final bool showIndicator;
  final EdgeInsets padding;

  @override
  State<FloatingAIBubble> createState() => _FloatingAIBubbleState();
}

class _FloatingAIBubbleState extends State<FloatingAIBubble> {
  Offset? _position;

  static const Color _bubble = Color(0xFF123445);
  static const Color _outline = Color(0x334FC3F7);
  static const Color _iconColor = Color(0xFF65D9FF);
  static const Color _indicator = Color(0xFF7BE4FF);

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _position ??= _initialPosition();
  }

  Offset _initialPosition() {
    final maxX = widget.boundsSize.width - widget.size - widget.padding.right;
    final maxY = widget.boundsSize.height - widget.size - widget.padding.bottom - 72;

    return Offset(
      maxX.clamp(widget.padding.left, double.infinity),
      maxY.clamp(widget.padding.top + 120, double.infinity),
    );
  }

  void _handlePanUpdate(DragUpdateDetails details) {
    if (_position == null) return;

    final nextX = (_position!.dx + details.delta.dx).clamp(
      widget.padding.left,
      widget.boundsSize.width - widget.size - widget.padding.right,
    );

    final nextY = (_position!.dy + details.delta.dy).clamp(
      widget.padding.top,
      widget.boundsSize.height - widget.size - widget.padding.bottom,
    );

    setState(() {
      _position = Offset(nextX, nextY);
    });
  }

  @override
  Widget build(BuildContext context) {
    final position = _position ?? _initialPosition();

    return Positioned(
      left: position.dx,
      top: position.dy,
      child: GestureDetector(
        onTap: widget.onTap,
        onPanUpdate: _handlePanUpdate,
        child: SizedBox(
          width: widget.size + 10,
          height: widget.size + 10,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: widget.size,
                height: widget.size,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _bubble.withOpacity(0.94),
                  border: Border.all(color: _outline, width: 2),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x3300CFFF),
                      blurRadius: 16,
                      offset: Offset(0, 8),
                    ),
                  ],
                ),
                child: Icon(
                  widget.icon,
                  color: _iconColor,
                  size: widget.size * 0.38,
                ),
              ),
              if (widget.showIndicator)
                Positioned(
                  top: 2,
                  right: 2,
                  child: Container(
                    width: widget.size * 0.18,
                    height: widget.size * 0.18,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: _indicator,
                      boxShadow: [
                        BoxShadow(
                          color: Color(0x6637D9FF),
                          blurRadius: 8,
                        ),
                      ],
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
