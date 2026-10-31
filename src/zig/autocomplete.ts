/**
 * Zig Language (0.13.0+) Comprehensive Intelligent Auto-Completion Engine.
 * Features:
 *  - Control flow: if, if-else, if optional unwrapping, if error unwrapping, while, for, switch
 *  - Standard library: std.debug, std.math, std.mem, std.fmt, std.heap, std.ArrayList, std.HashMap, std.fs, std.time
 *  - Builtin functions: @import, @as, @intCast, @floatCast, @sizeOf, @min, @max, @abs, etc.
 *  - Data structures: struct, enum, union, error set, test
 *  - Memory management: GPA, defer, errdefer, allocator
 */

import { CompletionItem } from '../types';

export const ZIG_STANDARD_COMPLETIONS: CompletionItem[] = [
  // =========================================================================
  // 1. DIRECTIVES, IMPORTS & ENTRY POINT
  // =========================================================================
  {
    id: 'zig-import-std',
    label: 'const std = @import("std");',
    kind: 'snippet',
    detail: 'Importation de la bibliothèque standard Zig (std)',
    insertText: 'const std = @import("std");\n',
  },
  {
    id: 'zig-main',
    label: 'pub fn main() !void',
    kind: 'snippet',
    detail: 'Point d\'entrée standard pub fn main() !void',
    insertText: 'pub fn main() !void {\n    std.debug.print("Hello from Zig!\\n", .{});\n}',
  },
  {
    id: 'zig-fn',
    label: 'fn name(params) ReturnType',
    kind: 'snippet',
    detail: 'Déclaration d\'une fonction privée ou locale',
    insertText: 'fn ${1:name}(${2:params}) ${3:void} {\n    $0\n}',
  },
  {
    id: 'zig-pub-fn',
    label: 'pub fn name(params) ReturnType',
    kind: 'snippet',
    detail: 'Déclaration d\'une fonction publique exportable',
    insertText: 'pub fn ${1:name}(${2:params}) ${3:void} {\n    $0\n}',
  },

  // =========================================================================
  // 2. INSTRUCTIONS DE CONTRÔLE : IF / ELSE & CAPTURES
  // =========================================================================
  {
    id: 'zig-if',
    label: 'if (condition)',
    kind: 'snippet',
    detail: 'Condition if (condition) { ... }',
    insertText: 'if (${1:condition}) {\n    $0\n}',
  },
  {
    id: 'zig-if-else',
    label: 'if (condition) else',
    kind: 'snippet',
    detail: 'Branchement conditionnel complet if ... else',
    insertText: 'if (${1:condition}) {\n    $2\n} else {\n    $0\n}',
  },
  {
    id: 'zig-if-optional',
    label: 'if (optional) |val|',
    kind: 'snippet',
    detail: 'Déballage sécurisé de valeur optionnelle (?T)',
    insertText: 'if (${1:optional_val}) |${2:val}| {\n    $0\n}',
  },
  {
    id: 'zig-if-optional-else',
    label: 'if (optional) |val| else',
    kind: 'snippet',
    detail: 'Déballage optionnel avec branche de secours null',
    insertText: 'if (${1:optional_val}) |${2:val}| {\n    $3\n} else {\n    $0\n}',
  },
  {
    id: 'zig-if-error-union',
    label: 'if (res) |val| else |err|',
    kind: 'snippet',
    detail: 'Déballage d\'union d\'erreur (!T) avec capture de l\'erreur',
    insertText: 'if (${1:error_union}) |${2:val}| {\n    $3\n} else |${4:err}| {\n    $0\n}',
  },
  {
    id: 'zig-if-ternary',
    label: 'if (cond) a else b',
    kind: 'snippet',
    detail: 'Expression ternaire Zig (if en tant qu\'expression de valeur)',
    insertText: 'if (${1:condition}) ${2:val_a} else ${3:val_b}',
  },

  // =========================================================================
  // 3. BOUCLES : WHILE, FOR & SWITCH
  // =========================================================================
  {
    id: 'zig-while',
    label: 'while (condition)',
    kind: 'snippet',
    detail: 'Boucle while standard',
    insertText: 'while (${1:condition}) {\n    $0\n}',
  },
  {
    id: 'zig-while-continue',
    label: 'while (cond) : (continue_expr)',
    kind: 'snippet',
    detail: 'Boucle while avec expression de continuation (incrémentation)',
    insertText: 'var i: usize = 0;\nwhile (i < ${1:10}) : (i += 1) {\n    $0\n}',
  },
  {
    id: 'zig-while-optional',
    label: 'while (optional) |val|',
    kind: 'snippet',
    detail: 'Itération tant que la valeur optionnelle n\'est pas nulle',
    insertText: 'while (${1:iterator.next()}) |${2:item}| {\n    $0\n}',
  },
  {
    id: 'zig-for-items',
    label: 'for (items) |item|',
    kind: 'snippet',
    detail: 'Boucle for itérant sur un tableau ou une tranche',
    insertText: 'for (${1:items}) |${2:item}| {\n    $0\n}',
  },
  {
    id: 'zig-for-indexed',
    label: 'for (items, 0..) |item, i|',
    kind: 'snippet',
    detail: 'Boucle for multi-itérateurs avec index numérique',
    insertText: 'for (${1:items}, 0..) |${2:item}, ${3:i}| {\n    $0\n}',
  },
  {
    id: 'zig-switch',
    label: 'switch (value)',
    kind: 'snippet',
    detail: 'Filtrage exhaustif par motif avec switch',
    insertText: 'switch (${1:value}) {\n    ${2:1} => ${3:std.debug.print("Un\\n", .{})},\n    else => ${0:std.debug.print("Autre\\n", .{})},\n}',
  },

  // =========================================================================
  // 4. GESTION DE MÉMOIRE, ALLOCATEURS & DEFER
  // =========================================================================
  {
    id: 'zig-gpa-init',
    label: 'GeneralPurposeAllocator',
    kind: 'snippet',
    detail: 'Allocation dynamique sécurisée avec détection de fuites (GPA)',
    insertText:
      'var gpa = std.heap.GeneralPurposeAllocator(.{}){};\ndefer _ = gpa.deinit();\nconst allocator = gpa.allocator();',
  },
  {
    id: 'zig-arena-init',
    label: 'std.heap.ArenaAllocator',
    kind: 'snippet',
    detail: 'Allocateur arène libérant toutes les allocations en un seul appel',
    insertText:
      'var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);\ndefer arena.deinit();\nconst allocator = arena.allocator();',
  },
  {
    id: 'zig-page-allocator',
    label: 'std.heap.page_allocator',
    kind: 'keyword',
    detail: 'Allocateur direct par pages de l\'OS (sans suivi GPA)',
    insertText: 'std.heap.page_allocator',
  },
  {
    id: 'zig-alloc',
    label: 'allocator.alloc',
    kind: 'function',
    detail: 'try allocator.alloc(T, n) ([]T)',
    insertText: 'try allocator.alloc(${1:u8}, ${2:1024});',
  },
  {
    id: 'zig-defer-free',
    label: 'defer allocator.free',
    kind: 'snippet',
    detail: 'Libération différée automatique d\'une tranche allouée',
    insertText: 'defer allocator.free(${1:slice});',
  },
  {
    id: 'zig-create',
    label: 'allocator.create',
    kind: 'function',
    detail: 'try allocator.create(T) (*T) - alloue un objet unique',
    insertText: 'try allocator.create(${1:MyStruct});',
  },
  {
    id: 'zig-destroy',
    label: 'defer allocator.destroy',
    kind: 'snippet',
    detail: 'Libération différée automatique d\'un pointeur d\'objet alloué',
    insertText: 'defer allocator.destroy(${1:ptr});',
  },
  {
    id: 'zig-dupe',
    label: 'allocator.dupe',
    kind: 'function',
    detail: 'try allocator.dupe(T, slice) - clone une tranche en mémoire dynamique',
    insertText: 'try allocator.dupe(${1:u8}, ${2:slice});',
  },
  {
    id: 'zig-defer',
    label: 'defer',
    kind: 'keyword',
    detail: 'Exécute l\'instruction à la fin de la portée (ordre LIFO garanti)',
    insertText: 'defer ',
  },
  {
    id: 'zig-errdefer',
    label: 'errdefer',
    kind: 'keyword',
    detail: 'Exécute le nettoyage uniquement si la fonction retourne une erreur',
    insertText: 'errdefer ',
  },

  // =========================================================================
  // 5. AFFICHAGE, LOGGING & STD.DEBUG
  // =========================================================================
  {
    id: 'zig-print',
    label: 'std.debug.print',
    kind: 'function',
    detail: 'std.debug.print(comptime fmt, args) void',
    insertText: 'std.debug.print("${1:{s}}\\n", .{${2:"Hello"}});',
  },
  {
    id: 'zig-print-num',
    label: 'std.debug.print (valeur)',
    kind: 'snippet',
    detail: 'Afficher une variable avec spécificateur {} ou {d}',
    insertText: 'std.debug.print("${1:valeur}: {}\\n", .{${2:val}});',
  },
  {
    id: 'zig-debug-assert',
    label: 'std.debug.assert',
    kind: 'function',
    detail: 'std.debug.assert(ok: bool) - panique si la condition est fausse',
    insertText: 'std.debug.assert(${1:condition});',
  },
  {
    id: 'zig-debug-panic',
    label: 'std.debug.panic',
    kind: 'function',
    detail: 'std.debug.panic(fmt, args) - interrompt avec pile d\'appels',
    insertText: 'std.debug.panic("${1:Crash fatal: {s}}", .{${2:"motif"}});',
  },

  // =========================================================================
  // 6. COLLECTIONS DYNAMIQUES : ARRAYLIST & HASHMAP
  // =========================================================================
  {
    id: 'zig-arraylist',
    label: 'std.ArrayList(T).init',
    kind: 'snippet',
    detail: 'Tableau dynamique extensible avec libération defer list.deinit()',
    insertText: 'var list = std.ArrayList(${1:i32}).init(allocator);\ndefer list.deinit();',
  },
  {
    id: 'zig-arraylist-append',
    label: 'list.append(val)',
    kind: 'function',
    detail: 'try list.append(valeur) - ajoute un élément en fin de liste',
    insertText: 'try list.append(${1:val});',
  },
  {
    id: 'zig-autohashmap',
    label: 'std.AutoHashMap(K, V).init',
    kind: 'snippet',
    detail: 'Table de hachage typée clé/valeur',
    insertText: 'var map = std.AutoHashMap(${1:u32}, ${2:[]const u8}).init(allocator);\ndefer map.deinit();',
  },
  {
    id: 'zig-stringhashmap',
    label: 'std.StringHashMap(V).init',
    kind: 'snippet',
    detail: 'Table de hachage avec chaînes de caractères en clés',
    insertText: 'var map = std.StringHashMap(${1:i32}).init(allocator);\ndefer map.deinit();',
  },

  // =========================================================================
  // 7. MATHÉMATIQUES (STD.MATH)
  // =========================================================================
  {
    id: 'zig-math-max',
    label: 'std.math.max(a, b)',
    kind: 'function',
    detail: 'std.math.max(a, b) - retourne la valeur maximale',
    insertText: 'std.math.max(${1:a}, ${2:b})',
  },
  {
    id: 'zig-math-min',
    label: 'std.math.min(a, b)',
    kind: 'function',
    detail: 'std.math.min(a, b) - retourne la valeur minimale',
    insertText: 'std.math.min(${1:a}, ${2:b})',
  },
  {
    id: 'zig-math-clamp',
    label: 'std.math.clamp(val, min, max)',
    kind: 'function',
    detail: 'std.math.clamp(val, min, max) - borne une valeur dans un intervalle',
    insertText: 'std.math.clamp(${1:val}, ${2:min}, ${3:max})',
  },
  {
    id: 'zig-math-sqrt',
    label: 'std.math.sqrt(x)',
    kind: 'function',
    detail: 'std.math.sqrt(x) - racine carrée',
    insertText: 'std.math.sqrt(${1:x})',
  },
  {
    id: 'zig-math-pow',
    label: 'std.math.pow(T, base, exp)',
    kind: 'function',
    detail: 'std.math.pow(T, base, exp) - puissance',
    insertText: 'std.math.pow(${1:f64}, ${2:base}, ${3:exp})',
  },
  {
    id: 'zig-math-abs',
    label: 'std.math.absInt(x)',
    kind: 'function',
    detail: 'try std.math.absInt(x) - valeur absolue entière',
    insertText: 'try std.math.absInt(${1:x})',
  },
  {
    id: 'zig-math-floor',
    label: 'std.math.floor(x)',
    kind: 'function',
    detail: 'std.math.floor(x) - arrondi inférieur',
    insertText: 'std.math.floor(${1:x})',
  },
  {
    id: 'zig-math-ceil',
    label: 'std.math.ceil(x)',
    kind: 'function',
    detail: 'std.math.ceil(x) - arrondi supérieur',
    insertText: 'std.math.ceil(${1:x})',
  },
  {
    id: 'zig-math-pi',
    label: 'std.math.pi',
    kind: 'keyword',
    detail: 'Constante mathématique Pi (3.14159...)',
    insertText: 'std.math.pi',
  },

  // =========================================================================
  // 8. GESTION DES CHAÎNES & TRANCHES (STD.MEM)
  // =========================================================================
  {
    id: 'zig-mem-eql',
    label: 'std.mem.eql(u8, a, b)',
    kind: 'function',
    detail: 'std.mem.eql(u8, a, b) bool - compare l\'égalité de deux chaînes ou tranches',
    insertText: 'std.mem.eql(u8, ${1:a}, ${2:b})',
  },
  {
    id: 'zig-mem-copy',
    label: 'std.mem.copy(T, dest, src)',
    kind: 'function',
    detail: 'std.mem.copy(T, dest, src) - copie des éléments dans une tranche',
    insertText: 'std.mem.copy(${1:u8}, ${2:dest}, ${3:src});',
  },
  {
    id: 'zig-mem-set',
    label: 'std.mem.set(T, dest, val)',
    kind: 'function',
    detail: 'std.mem.set(T, dest, val) - remplit une tranche avec une valeur',
    insertText: 'std.mem.set(${1:u8}, ${2:dest}, ${3:0});',
  },
  {
    id: 'zig-mem-trim',
    label: 'std.mem.trim(u8, str, values)',
    kind: 'function',
    detail: 'std.mem.trim(u8, str, values) - supprime les espaces ou motifs aux extrémités',
    insertText: 'std.mem.trim(u8, ${1:str}, " \\t\\n\\r")',
  },
  {
    id: 'zig-mem-indexof',
    label: 'std.mem.indexOf(u8, slice, needle)',
    kind: 'function',
    detail: 'std.mem.indexOf(u8, slice, needle) - recherche une sous-chaîne (?usize)',
    insertText: 'std.mem.indexOf(u8, ${1:slice}, ${2:needle})',
  },
  {
    id: 'zig-mem-split-scalar',
    label: 'std.mem.splitScalar(u8, str, delim)',
    kind: 'function',
    detail: 'std.mem.splitScalar(u8, str, delim) - itérateur de découpe de chaîne',
    insertText: 'var it = std.mem.splitScalar(u8, ${1:str}, ${2:\',\'});',
  },

  // =========================================================================
  // 9. FORMATTAGE (STD.FMT)
  // =========================================================================
  {
    id: 'zig-fmt-allocprint',
    label: 'std.fmt.allocPrint',
    kind: 'function',
    detail: 'try std.fmt.allocPrint(allocator, fmt, args) - formate en chaîne allouée',
    insertText: 'try std.fmt.allocPrint(allocator, "${1:{s}}", .{${2:"texte"}});',
  },
  {
    id: 'zig-fmt-bufprint',
    label: 'std.fmt.bufPrint',
    kind: 'function',
    detail: 'try std.fmt.bufPrint(buf, fmt, args) - formate dans un buffer fixe',
    insertText: 'try std.fmt.bufPrint(&buf, "${1:{s}}", .{${2:"texte"}});',
  },
  {
    id: 'zig-fmt-parseint',
    label: 'std.fmt.parseInt(T, str, base)',
    kind: 'function',
    detail: 'try std.fmt.parseInt(i32, str, 10) - convertit chaîne en entier',
    insertText: 'try std.fmt.parseInt(${1:i32}, ${2:str}, 10)',
  },
  {
    id: 'zig-fmt-parsefloat',
    label: 'std.fmt.parseFloat(T, str)',
    kind: 'function',
    detail: 'try std.fmt.parseFloat(f64, str) - convertit chaîne en flottant',
    insertText: 'try std.fmt.parseFloat(${1:f64}, ${2:str})',
  },

  // =========================================================================
  // 10. GESTION DU TEMPS & FICHIERS (STD.TIME / STD.FS)
  // =========================================================================
  {
    id: 'zig-time-millitamp',
    label: 'std.time.milliTimestamp()',
    kind: 'function',
    detail: 'std.time.milliTimestamp() i64 - timestamp Unix en millisecondes',
    insertText: 'std.time.milliTimestamp()',
  },
  {
    id: 'zig-time-sleep',
    label: 'std.time.sleep(ns)',
    kind: 'function',
    detail: 'std.time.sleep(ns) - met en pause pendant n nanosecondes',
    insertText: 'std.time.sleep(${1:1000 * std.time.ns_per_ms});',
  },
  {
    id: 'zig-fs-cwd',
    label: 'std.fs.cwd()',
    kind: 'function',
    detail: 'std.fs.cwd() - répertoire courant pour opérations de fichiers',
    insertText: 'std.fs.cwd()',
  },

  // =========================================================================
  // 11. TESTS UNITAIRES (STD.TESTING)
  // =========================================================================
  {
    id: 'zig-test',
    label: 'test "nom du test"',
    kind: 'snippet',
    detail: 'Bloc de test unitaire natif exécutable avec zig test',
    insertText: 'test "${1:nom du test}" {\n    try std.testing.expect(${2:true});\n}',
  },
  {
    id: 'zig-testing-expect',
    label: 'std.testing.expect(bool)',
    kind: 'function',
    detail: 'try std.testing.expect(condition) - assertion de test unitaire',
    insertText: 'try std.testing.expect(${1:condition});',
  },
  {
    id: 'zig-testing-expectequal',
    label: 'std.testing.expectEqual(attendu, reel)',
    kind: 'function',
    detail: 'try std.testing.expectEqual(attendu, reel) - comparaison stricte',
    insertText: 'try std.testing.expectEqual(${1:attendu}, ${2:reel});',
  },

  // =========================================================================
  // 12. TYPES, STRUCTURES & ERREURS
  // =========================================================================
  {
    id: 'zig-struct',
    label: 'const MyStruct = struct',
    kind: 'snippet',
    detail: 'Déclaration d\'une structure de données avec constructeur init',
    insertText: 'const ${1:Point} = struct {\n    ${2:x}: f32,\n    ${3:y}: f32,\n\n    pub fn init(${2:x}: f32, ${3:y}: f32) ${1:Point} {\n        return ${1:Point}{ .${2:x} = ${2:x}, .${3:y} = ${3:y} };\n    }\n};',
  },
  {
    id: 'zig-enum',
    label: 'const MyEnum = enum',
    kind: 'snippet',
    detail: 'Énumération typée avec variantes',
    insertText: 'const ${1:Status} = enum {\n    ${2:pending},\n    ${3:running},\n    ${4:completed},\n};',
  },
  {
    id: 'zig-union-enum',
    label: 'const TaggedUnion = union(enum)',
    kind: 'snippet',
    detail: 'Union étiquetée (Tagged Union) sûre et exhaustive',
    insertText: 'const ${1:Payload} = union(enum) {\n    int: i32,\n    float: f64,\n    text: []const u8,\n};',
  },
  {
    id: 'zig-error-set',
    label: 'const MyError = error',
    kind: 'snippet',
    detail: 'Définition d\'un ensemble d\'erreurs explicites',
    insertText: 'const ${1:AppError} = error{\n    ${2:NotFound},\n    ${3:AccessDenied},\n    ${4:OutOfMemory},\n};',
  },

  // =========================================================================
  // 13. FONCTIONS INTÉGRÉES BUILT-IN (@)
  // =========================================================================
  {
    id: 'zig-builtin-import',
    label: '@import',
    kind: 'keyword',
    detail: '@import("package_or_file") - importe un module ou un fichier',
    insertText: '@import("${1:std}")',
  },
  {
    id: 'zig-builtin-as',
    label: '@as(T, value)',
    kind: 'keyword',
    detail: '@as(T, value) - coercition de type explicite',
    insertText: '@as(${1:T}, ${2:value})',
  },
  {
    id: 'zig-builtin-intcast',
    label: '@intCast(value)',
    kind: 'keyword',
    detail: '@intCast(value) - conversion d\'entiers avec vérification de débordement',
    insertText: '@intCast(${1:value})',
  },
  {
    id: 'zig-builtin-floatcast',
    label: '@floatCast(value)',
    kind: 'keyword',
    detail: '@floatCast(value) - conversion de type flottant',
    insertText: '@floatCast(${1:value})',
  },
  {
    id: 'zig-builtin-ptrcast',
    label: '@ptrCast(ptr)',
    kind: 'keyword',
    detail: '@ptrCast(ptr) - conversion de pointeur brut',
    insertText: '@ptrCast(${1:ptr})',
  },
  {
    id: 'zig-builtin-sizeof',
    label: '@sizeOf(T)',
    kind: 'keyword',
    detail: '@sizeOf(T) usize - taille en octets d\'un type à la compilation',
    insertText: '@sizeOf(${1:T})',
  },
  {
    id: 'zig-builtin-min',
    label: '@min(a, b)',
    kind: 'keyword',
    detail: '@min(a, b) - minimum intrinsèque du compilateur',
    insertText: '@min(${1:a}, ${2:b})',
  },
  {
    id: 'zig-builtin-max',
    label: '@max(a, b)',
    kind: 'keyword',
    detail: '@max(a, b) - maximum intrinsèque du compilateur',
    insertText: '@max(${1:a}, ${2:b})',
  },
  {
    id: 'zig-builtin-abs',
    label: '@abs(x)',
    kind: 'keyword',
    detail: '@abs(x) - valeur absolue intrinsèque',
    insertText: '@abs(${1:x})',
  },
  {
    id: 'zig-builtin-sqrt',
    label: '@sqrt(x)',
    kind: 'keyword',
    detail: '@sqrt(x) - racine carrée matérielle intrinsèque',
    insertText: '@sqrt(${1:x})',
  },
  {
    id: 'zig-builtin-panic',
    label: '@panic(message)',
    kind: 'keyword',
    detail: '@panic(message) - arrêt immédiat du programme avec message',
    insertText: '@panic("${1:Erreur fatale}");',
  },

  // =========================================================================
  // 14. MOTS-CLÉS ESSENTIELS ZIG
  // =========================================================================
  { id: 'zig-kw-if', label: 'if', kind: 'keyword', detail: 'Structure conditionnelle if', insertText: 'if ' },
  { id: 'zig-kw-else', label: 'else', kind: 'keyword', detail: 'Branche alternative else', insertText: 'else ' },
  { id: 'zig-kw-const', label: 'const', kind: 'keyword', detail: 'Déclaration d\'une constante immuable', insertText: 'const ' },
  { id: 'zig-kw-var', label: 'var', kind: 'keyword', detail: 'Déclaration d\'une variable modifiable', insertText: 'var ' },
  { id: 'zig-kw-pub', label: 'pub', kind: 'keyword', detail: 'Visibilité publique pour exportation', insertText: 'pub ' },
  { id: 'zig-kw-try', label: 'try', kind: 'keyword', detail: 'Propage l\'erreur ou déballe la valeur réussie', insertText: 'try ' },
  { id: 'zig-kw-catch', label: 'catch', kind: 'keyword', detail: 'Attrape et gère une union d\'erreur', insertText: 'catch ' },
  { id: 'zig-kw-orelse', label: 'orelse', kind: 'keyword', detail: 'Fournit un repli si l\'optionnel vaut null', insertText: 'orelse ' },
  { id: 'zig-kw-return', label: 'return', kind: 'keyword', detail: 'Retourne une valeur depuis une fonction', insertText: 'return ' },
  { id: 'zig-kw-break', label: 'break', kind: 'keyword', detail: 'Interrompt une boucle avec valeur facultative', insertText: 'break' },
  { id: 'zig-kw-continue', label: 'continue', kind: 'keyword', detail: 'Passe à l\'itération suivante de boucle', insertText: 'continue;' },
  { id: 'zig-kw-unreachable', label: 'unreachable', kind: 'keyword', detail: 'Déclare du code inaccessible (panique en mode Debug)', insertText: 'unreachable;' },
  { id: 'zig-kw-comptime', label: 'comptime', kind: 'keyword', detail: 'Exécution garantie au moment de la compilation', insertText: 'comptime ' },
  { id: 'zig-kw-inline', label: 'inline', kind: 'keyword', detail: 'Force l\'inlining de boucle ou de fonction', insertText: 'inline ' },
];

export function getZigCompletionsForQuery(query: string, currentCode: string = ''): CompletionItem[] {
  const q = query.toLowerCase().trim();

  // Extract variables and functions declared in currentCode
  const customItems: CompletionItem[] = [];
  const lines = currentCode.split('\n');

  for (let idx = 0; idx < lines.length; idx++) {
    const trimmed = lines[idx].trim();

    // Match const x = ... or var y = ...
    const varMatch = trimmed.match(/^(?:pub\s+)?(?:const|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (varMatch && !ZIG_STANDARD_COMPLETIONS.some((c) => c.label === varMatch[1])) {
      customItems.push({
        id: `zig-var-${varMatch[1]}-${idx}`,
        label: varMatch[1],
        kind: 'variable',
        detail: `Identifiant déclaré dans votre code Zig`,
        insertText: varMatch[1],
      });
    }

    // Match functions: pub fn calculate(a: i32) i32 { ... }
    const funcMatch = trimmed.match(/^(?:pub\s+)?fn\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
    if (funcMatch && funcMatch[1] !== 'main' && !ZIG_STANDARD_COMPLETIONS.some((c) => c.label === funcMatch[1])) {
      customItems.push({
        id: `zig-fn-${funcMatch[1]}-${idx}`,
        label: funcMatch[1],
        kind: 'function',
        detail: `Fonction locale déclarée dans votre code Zig`,
        insertText: `${funcMatch[1]}()`,
      });
    }
  }

  const all = [...ZIG_STANDARD_COMPLETIONS, ...customItems];

  if (!q) {
    return all.slice(0, 15);
  }

  // Exact starts-with first, then includes
  const matches = all.filter(
    (item) => item.label.toLowerCase().includes(q) || item.detail.toLowerCase().includes(q)
  );

  matches.sort((a, b) => {
    const aStarts = a.label.toLowerCase().startsWith(q) ? 0 : 1;
    const bStarts = b.label.toLowerCase().startsWith(q) ? 0 : 1;
    return aStarts - bStarts;
  });

  return matches.slice(0, 15);
}
