"""Minimal GLB writer: skinned meshes with custom vertex attributes."""
import json
import struct
import numpy as np

CT = {np.dtype('float32'): 5126, np.dtype('uint32'): 5125, np.dtype('uint16'): 5123, np.dtype('uint8'): 5121, np.dtype('int16'): 5122, np.dtype('int8'): 5120}
TYPES = {1: 'SCALAR', 2: 'VEC2', 3: 'VEC3', 4: 'VEC4', 16: 'MAT4'}


class GLB:
    def __init__(self):
        self.bin = bytearray()
        self.j = {'asset': {'version': '2.0', 'generator': 'creature-catch-epic sculpt.py'}, 'scene': 0, 'scenes': [{'nodes': []}],
                  'nodes': [], 'meshes': [], 'accessors': [], 'bufferViews': [], 'materials': [], 'skins': []}

    def accessor(self, arr, target=None, minmax=False, normalized=False):
        arr = np.ascontiguousarray(arr)
        n = arr.shape[0]
        comps = 1 if arr.ndim == 1 else arr.shape[1]
        while len(self.bin) % 4:
            self.bin.append(0)
        off = len(self.bin)
        self.bin += arr.tobytes()
        bv = {'buffer': 0, 'byteOffset': off, 'byteLength': arr.nbytes}
        if target == 34962 and arr.itemsize * comps % 4:
            raise ValueError('vertex attribute stride must be a multiple of 4')
        if target:
            bv['target'] = target
        self.j['bufferViews'].append(bv)
        acc = {'bufferView': len(self.j['bufferViews']) - 1, 'componentType': CT[arr.dtype], 'count': n, 'type': TYPES[comps]}
        if normalized:
            acc['normalized'] = True
        if minmax:
            a2 = arr.reshape(n, comps)
            acc['min'] = [float(x) for x in a2.min(0)]
            acc['max'] = [float(x) for x in a2.max(0)]
        self.j['accessors'].append(acc)
        return len(self.j['accessors']) - 1

    def material(self, name, **kw):
        m = {'name': name, 'pbrMetallicRoughness': {'baseColorFactor': kw.get('color', [1, 1, 1, 1]), 'metallicFactor': 0.0,
                                                    'roughnessFactor': kw.get('rough', 0.6)}}
        if kw.get('double'):
            m['doubleSided'] = True
        if kw.get('blend'):
            m['alphaMode'] = 'BLEND'
        self.j['materials'].append(m)
        return len(self.j['materials']) - 1

    def mesh(self, name, attrs, faces, material, skin=None):
        prim = {'attributes': {}, 'material': material, 'mode': 4}
        for k, a in attrs.items():
            a = np.asarray(a)
            norm = a.dtype in (np.uint8, np.int16, np.int8) and not k.startswith('JOINTS')
            prim['attributes'][k] = self.accessor(a, 34962, minmax=(k == 'POSITION'), normalized=norm)
        prim['indices'] = self.accessor(np.asarray(faces, np.uint32).ravel(), 34963)
        self.j['meshes'].append({'name': name, 'primitives': [prim]})
        node = {'name': name, 'mesh': len(self.j['meshes']) - 1}
        if skin is not None:
            node['skin'] = skin
        self.j['nodes'].append(node)
        idx = len(self.j['nodes']) - 1
        self.j['scenes'][0]['nodes'].append(idx)
        return idx

    def skeleton(self, joints):
        """joints: list of (name, parent_index or -1, world_pos (3,), world_rot 3x3 or None)."""
        base = len(self.j['nodes'])
        ibm = np.zeros((len(joints), 16), np.float32)
        for i, (name, par, pos, R) in enumerate(joints):
            pos = np.asarray(pos, float)
            ppos = np.zeros(3) if par < 0 else np.asarray(joints[par][2], float)
            node = {'name': name, 'translation': [float(x) for x in (pos - ppos)]}
            self.j['nodes'].append(node)
            if par >= 0:
                self.j['nodes'][base + par].setdefault('children', []).append(base + i)
            else:
                self.j['scenes'][0]['nodes'].append(base + i)
            M = np.eye(4)
            M[:3, 3] = -pos
            ibm[i] = M.T.reshape(16)  # column-major
        acc = self.accessor(ibm)
        self.j['skins'].append({'joints': list(range(base, base + len(joints))), 'inverseBindMatrices': acc, 'skeleton': base})
        return len(self.j['skins']) - 1

    def save(self, path, extras=None):
        if extras is not None:
            self.j['scenes'][0]['extras'] = extras
        while len(self.bin) % 4:
            self.bin.append(0)
        self.j['buffers'] = [{'byteLength': len(self.bin)}]
        self.j['extensionsUsed'] = ['KHR_mesh_quantization']
        self.j['extensionsRequired'] = ['KHR_mesh_quantization']
        js = json.dumps(self.j, separators=(',', ':')).encode()
        while len(js) % 4:
            js += b' '
        total = 12 + 8 + len(js) + 8 + len(self.bin)
        with open(path, 'wb') as f:
            f.write(struct.pack('<4sII', b'glTF', 2, total))
            f.write(struct.pack('<I4s', len(js), b'JSON'))
            f.write(js)
            f.write(struct.pack('<I4s', len(self.bin), b'BIN\x00'))
            f.write(self.bin)
        return total
