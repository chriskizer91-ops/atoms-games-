#!/usr/bin/env python3
"""Dev server: serves this folder, plus three.js from THREE_DIR at /three/."""
import http.server, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THREE = os.environ.get('THREE_DIR', os.path.join(ROOT, 'node_modules', 'three'))
class H(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        path = path.split('?')[0]
        if path.startswith('/three/'):
            return os.path.join(THREE, path[len('/three/'):])
        return os.path.join(ROOT, path.lstrip('/'))
    def log_message(self, *a): pass
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store'); super().end_headers()
http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1]) if len(sys.argv) > 1 else 8766), H).serve_forever()
