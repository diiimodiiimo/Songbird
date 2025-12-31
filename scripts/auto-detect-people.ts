import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Common false positives to ignore (expanded list)
const FALSE_POSITIVES = new Set([
  // Time/date words
  'today', 'yesterday', 'tomorrow', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
  'morning', 'afternoon', 'evening', 'night', 'day', 'week', 'month', 'year', 'hour', 'hours', 'minute', 'minutes',
  // Music-related
  'song', 'music', 'album', 'artist', 'track', 'playlist', 'spotify', 'sound', 'beat', 'lyrics',
  // Common articles/prepositions
  'the', 'a', 'an', 'and', 'or', 'but', 'with', 'from', 'to', 'for', 'of', 'in', 'on', 'at', 'by', 'as', 'is', 'was', 'are', 'were',
  // Common verbs (past tense, present, etc.)
  'had', 'got', 'got', 'went', 'came', 'saw', 'did', 'didn', 'made', 'took', 'gave', 'got', 'got', 'got',
  'then', 'when', 'where', 'what', 'who', 'why', 'how', 'this', 'that', 'these', 'those',
  'some', 'any', 'all', 'both', 'each', 'every', 'much', 'many', 'more', 'most', 'very', 'too', 'also', 'just', 'only',
  'can', 'could', 'should', 'would', 'will', 'shall', 'may', 'might', 'must',
  // Common adjectives
  'good', 'bad', 'big', 'small', 'long', 'short', 'new', 'old', 'young', 'hot', 'cold', 'warm', 'cool',
  'nice', 'fine', 'great', 'best', 'better', 'worse', 'worst', 'easy', 'hard', 'soft', 'loud', 'quiet',
  // Common nouns
  'time', 'times', 'place', 'way', 'thing', 'things', 'stuff', 'work', 'home', 'school', 'college', 'university',
  'class', 'classes', 'meeting', 'meetings', 'game', 'games', 'team', 'teams', 'group', 'groups',
  'food', 'drink', 'drinks', 'water', 'coffee', 'tea', 'beer', 'wine',
  'car', 'cars', 'bus', 'train', 'plane', 'flight', 'road', 'street', 'house', 'room', 'rooms',
  'phone', 'call', 'calls', 'text', 'texts', 'message', 'messages',
  'money', 'dollar', 'dollars', 'price', 'cost', 'free',
  'book', 'books', 'movie', 'movies', 'show', 'shows', 'tv', 'video', 'videos',
  'job', 'jobs', 'work', 'office', 'company', 'business',
  'friend', 'friends', 'family', 'mom', 'dad', 'parent', 'parents', 'brother', 'sister',
  'dog', 'dogs', 'cat', 'cats', 'pet', 'pets',
  'city', 'cities', 'town', 'state', 'country', 'world', 'worlds',
  'problem', 'problems', 'issue', 'issues', 'question', 'questions',
  'idea', 'ideas', 'plan', 'plans', 'project', 'projects',
  'start', 'starts', 'started', 'starting', 'end', 'ends', 'ended', 'ending',
  'way', 'ways', 'side', 'sides', 'part', 'parts', 'piece', 'pieces',
  'kind', 'kinds', 'type', 'types', 'sort', 'sorts',
  'number', 'numbers', 'amount', 'amounts', 'lot', 'lots',
  'case', 'cases', 'point', 'points', 'line', 'lines',
  'life', 'lives', 'death', 'deaths', 'health', 'body', 'bodies',
  'hand', 'hands', 'head', 'heads', 'eye', 'eyes', 'face', 'faces',
  'foot', 'feet', 'leg', 'legs', 'arm', 'arms',
  'back', 'backs', 'front', 'fronts', 'top', 'tops', 'bottom', 'bottoms',
  'left', 'right', 'up', 'down', 'inside', 'outside',
  'morning', 'mornings', 'afternoon', 'afternoons', 'evening', 'evenings', 'night', 'nights',
  'today', 'yesterday', 'tomorrow',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'week', 'weeks', 'month', 'months', 'year', 'years',
  'hour', 'hours', 'minute', 'minutes', 'second', 'seconds',
  'morning', 'afternoon', 'evening', 'night', 'day', 'days',
  // Places/brands
  'popeyes', 'houston', 'american', 'target', 'walmart', 'starbucks', 'mcdonalds',
  // Other common words
  'here', 'there', 'where', 'everywhere', 'nowhere', 'anywhere', 'somewhere',
  'now', 'then', 'before', 'after', 'during', 'while', 'until', 'since',
  'yes', 'no', 'maybe', 'sure', 'ok', 'okay', 'alright', 'right', 'wrong',
  'true', 'false', 'real', 'really', 'actually', 'probably', 'maybe', 'perhaps',
  'first', 'last', 'next', 'previous', 'other', 'another', 'same', 'different',
  'same', 'different', 'similar', 'different', 'same', 'other', 'another',
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'hundred', 'thousand', 'million', 'billion',
  'once', 'twice', 'again', 'still', 'yet', 'already', 'soon', 'later', 'early',
  'always', 'never', 'often', 'sometimes', 'usually', 'rarely', 'seldom',
  'today', 'yesterday', 'tomorrow', 'tonight', 'this', 'that', 'these', 'those',
  'here', 'there', 'where', 'everywhere', 'nowhere', 'anywhere', 'somewhere',
  'now', 'then', 'when', 'where', 'why', 'how', 'what', 'who', 'which',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
  'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'yourselves', 'themselves',
  'this', 'that', 'these', 'those', 'such', 'same',
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having',
  'do', 'does', 'did', 'doing', 'done', 'get', 'gets', 'got', 'getting', 'gotten',
  'go', 'goes', 'went', 'going', 'gone', 'come', 'comes', 'came', 'coming',
  'see', 'sees', 'saw', 'seeing', 'seen', 'know', 'knows', 'knew', 'knowing', 'known',
  'think', 'thinks', 'thought', 'thinking', 'say', 'says', 'said', 'saying',
  'want', 'wants', 'wanted', 'wanting', 'need', 'needs', 'needed', 'needing',
  'like', 'likes', 'liked', 'liking', 'love', 'loves', 'loved', 'loving',
  'make', 'makes', 'made', 'making', 'take', 'takes', 'took', 'taking', 'taken',
  'give', 'gives', 'gave', 'giving', 'given', 'tell', 'tells', 'told', 'telling',
  'find', 'finds', 'found', 'finding', 'look', 'looks', 'looked', 'looking',
  'use', 'uses', 'used', 'using', 'try', 'tries', 'tried', 'trying',
  'ask', 'asks', 'asked', 'asking', 'work', 'works', 'worked', 'working',
  'seem', 'seems', 'seemed', 'seeming', 'feel', 'feels', 'felt', 'feeling',
  'try', 'tries', 'tried', 'trying', 'leave', 'leaves', 'left', 'leaving',
  'call', 'calls', 'called', 'calling', 'ask', 'asks', 'asked', 'asking',
  'need', 'needs', 'needed', 'needing', 'want', 'wants', 'wanted', 'wanting',
  'help', 'helps', 'helped', 'helping', 'show', 'shows', 'showed', 'showing', 'shown',
  'move', 'moves', 'moved', 'moving', 'live', 'lives', 'lived', 'living',
  'believe', 'believes', 'believed', 'believing', 'bring', 'brings', 'brought', 'bringing',
  'happen', 'happens', 'happened', 'happening', 'write', 'writes', 'wrote', 'writing', 'written',
  'provide', 'provides', 'provided', 'providing', 'sit', 'sits', 'sat', 'sitting',
  'stand', 'stands', 'stood', 'standing', 'lose', 'loses', 'lost', 'losing',
  'pay', 'pays', 'paid', 'paying', 'meet', 'meets', 'met', 'meeting',
  'include', 'includes', 'included', 'including', 'continue', 'continues', 'continued', 'continuing',
  'set', 'sets', 'set', 'setting', 'learn', 'learns', 'learned', 'learning', 'learnt',
  'change', 'changes', 'changed', 'changing', 'lead', 'leads', 'led', 'leading',
  'understand', 'understands', 'understood', 'understanding', 'watch', 'watches', 'watched', 'watching',
  'follow', 'follows', 'followed', 'following', 'stop', 'stops', 'stopped', 'stopping',
  'create', 'creates', 'created', 'creating', 'speak', 'speaks', 'spoke', 'speaking', 'spoken',
  'read', 'reads', 'read', 'reading', 'allow', 'allows', 'allowed', 'allowing',
  'add', 'adds', 'added', 'adding', 'spend', 'spends', 'spent', 'spending',
  'grow', 'grows', 'grew', 'growing', 'grown', 'open', 'opens', 'opened', 'opening',
  'walk', 'walks', 'walked', 'walking', 'win', 'wins', 'won', 'winning',
  'offer', 'offers', 'offered', 'offering', 'remember', 'remembers', 'remembered', 'remembering',
  'love', 'loves', 'loved', 'loving', 'consider', 'considers', 'considered', 'considering',
  'appear', 'appears', 'appeared', 'appearing', 'buy', 'buys', 'bought', 'buying',
  'wait', 'waits', 'waited', 'waiting', 'serve', 'serves', 'served', 'serving',
  'die', 'dies', 'died', 'dying', 'send', 'sends', 'sent', 'sending',
  'build', 'builds', 'built', 'building', 'stay', 'stays', 'stayed', 'staying',
  'fall', 'falls', 'fell', 'falling', 'fallen', 'cut', 'cuts', 'cut', 'cutting',
  'reach', 'reaches', 'reached', 'reaching', 'kill', 'kills', 'killed', 'killing',
  'raise', 'raises', 'raised', 'raising', 'pass', 'passes', 'passed', 'passing',
  'sell', 'sells', 'sold', 'selling', 'decide', 'decides', 'decided', 'deciding',
  'return', 'returns', 'returned', 'returning', 'explain', 'explains', 'explained', 'explaining',
  'develop', 'develops', 'developed', 'developing', 'receive', 'receives', 'received', 'receiving',
  'agree', 'agrees', 'agreed', 'agreeing', 'support', 'supports', 'supported', 'supporting',
  'hit', 'hits', 'hit', 'hitting', 'produce', 'produces', 'produced', 'producing',
  'eat', 'eats', 'ate', 'eating', 'eaten', 'cover', 'covers', 'covered', 'covering',
  'catch', 'catches', 'caught', 'catching', 'draw', 'draws', 'drew', 'drawing', 'drawn',
  'choose', 'chooses', 'chose', 'choosing', 'chosen', 'fail', 'fails', 'failed', 'failing',
  'fight', 'fights', 'fought', 'fighting', 'listen', 'listens', 'listened', 'listening',
  'notice', 'notices', 'noticed', 'noticing', 'save', 'saves', 'saved', 'saving',
  'reach', 'reaches', 'reached', 'reaching', 'throw', 'throws', 'threw', 'throwing', 'thrown',
  'accept', 'accepts', 'accepted', 'accepting', 'refuse', 'refuses', 'refused', 'refusing',
  'complete', 'completes', 'completed', 'completing', 'act', 'acts', 'acted', 'acting',
  'admit', 'admits', 'admitted', 'admitting', 'assume', 'assumes', 'assumed', 'assuming',
  'press', 'presses', 'pressed', 'pressing', 'wish', 'wishes', 'wished', 'wishing',
  'clean', 'cleans', 'cleaned', 'cleaning', 'prove', 'proves', 'proved', 'proving', 'proven',
  'beat', 'beats', 'beat', 'beating', 'beaten', 'burn', 'burns', 'burned', 'burning', 'burnt',
  'lift', 'lifts', 'lifted', 'lifting', 'earn', 'earns', 'earned', 'earning',
  'end', 'ends', 'ended', 'ending', 'enter', 'enters', 'entered', 'entering',
  'face', 'faces', 'faced', 'facing', 'test', 'tests', 'tested', 'testing',
  'form', 'forms', 'formed', 'forming', 'join', 'joins', 'joined', 'joining',
  'kill', 'kills', 'killed', 'killing', 'kiss', 'kisses', 'kissed', 'kissing',
  'laugh', 'laughs', 'laughed', 'laughing', 'lay', 'lays', 'laid', 'laying',
  'lie', 'lies', 'lay', 'lying', 'lain', 'lift', 'lifts', 'lifted', 'lifting',
  'lock', 'locks', 'locked', 'locking', 'look', 'looks', 'looked', 'looking',
  'manage', 'manages', 'managed', 'managing', 'mark', 'marks', 'marked', 'marking',
  'match', 'matches', 'matched', 'matching', 'matter', 'matters', 'mattered', 'mattering',
  'measure', 'measures', 'measured', 'measuring', 'mind', 'minds', 'minded', 'minding',
  'miss', 'misses', 'missed', 'missing', 'mix', 'mixes', 'mixed', 'mixing',
  'note', 'notes', 'noted', 'noting', 'notice', 'notices', 'noticed', 'noticing',
  'obtain', 'obtains', 'obtained', 'obtaining', 'occur', 'occurs', 'occurred', 'occurring',
  'park', 'parks', 'parked', 'parking', 'pass', 'passes', 'passed', 'passing',
  'perform', 'performs', 'performed', 'performing', 'pick', 'picks', 'picked', 'picking',
  'place', 'places', 'placed', 'placing', 'plan', 'plans', 'planned', 'planning',
  'plant', 'plants', 'planted', 'planting', 'play', 'plays', 'played', 'playing',
  'point', 'points', 'pointed', 'pointing', 'prepare', 'prepares', 'prepared', 'preparing',
  'present', 'presents', 'presented', 'presenting', 'press', 'presses', 'pressed', 'pressing',
  'prevent', 'prevents', 'prevented', 'preventing', 'produce', 'produces', 'produced', 'producing',
  'promise', 'promises', 'promised', 'promising', 'prove', 'proves', 'proved', 'proving', 'proven',
  'provide', 'provides', 'provided', 'providing', 'pull', 'pulls', 'pulled', 'pulling',
  'push', 'pushes', 'pushed', 'pushing', 'put', 'puts', 'put', 'putting',
  'raise', 'raises', 'raised', 'raising', 'reach', 'reaches', 'reached', 'reaching',
  'realize', 'realizes', 'realized', 'realizing', 'receive', 'receives', 'received', 'receiving',
  'recognize', 'recognizes', 'recognized', 'recognizing', 'record', 'records', 'recorded', 'recording',
  'reduce', 'reduces', 'reduced', 'reducing', 'refer', 'refers', 'referred', 'referring',
  'reflect', 'reflects', 'reflected', 'reflecting', 'refuse', 'refuses', 'refused', 'refusing',
  'regard', 'regards', 'regarded', 'regarding', 'relate', 'relates', 'related', 'relating',
  'relax', 'relaxes', 'relaxed', 'relaxing', 'release', 'releases', 'released', 'releasing',
  'remain', 'remains', 'remained', 'remaining', 'remember', 'remembers', 'remembered', 'remembering',
  'remind', 'reminds', 'reminded', 'reminding', 'remove', 'removes', 'removed', 'removing',
  'repair', 'repairs', 'repaired', 'repairing', 'repeat', 'repeats', 'repeated', 'repeating',
  'replace', 'replaces', 'replaced', 'replacing', 'reply', 'replies', 'replied', 'replying',
  'report', 'reports', 'reported', 'reporting', 'represent', 'represents', 'represented', 'representing',
  'request', 'requests', 'requested', 'requesting', 'require', 'requires', 'required', 'requiring',
  'research', 'researches', 'researched', 'researching', 'resolve', 'resolves', 'resolved', 'resolving',
  'respond', 'responds', 'responded', 'responding', 'rest', 'rests', 'rested', 'resting',
  'result', 'results', 'resulted', 'resulting', 'return', 'returns', 'returned', 'returning',
  'reveal', 'reveals', 'revealed', 'revealing', 'review', 'reviews', 'reviewed', 'reviewing',
  'ride', 'rides', 'rode', 'riding', 'ridden', 'ring', 'rings', 'rang', 'ringing', 'rung',
  'rise', 'rises', 'rose', 'rising', 'risen', 'risk', 'risks', 'risked', 'risking',
  'roll', 'rolls', 'rolled', 'rolling', 'rule', 'rules', 'ruled', 'ruling',
  'run', 'runs', 'ran', 'running', 'rush', 'rushes', 'rushed', 'rushing',
  'satisfy', 'satisfies', 'satisfied', 'satisfying', 'save', 'saves', 'saved', 'saving',
  'say', 'says', 'said', 'saying', 'scale', 'scales', 'scaled', 'scaling',
  'scan', 'scans', 'scanned', 'scanning', 'scare', 'scares', 'scared', 'scaring',
  'schedule', 'schedules', 'scheduled', 'scheduling', 'score', 'scores', 'scored', 'scoring',
  'scream', 'screams', 'screamed', 'screaming', 'search', 'searches', 'searched', 'searching',
  'seat', 'seats', 'seated', 'seating', 'secure', 'secures', 'secured', 'securing',
  'see', 'sees', 'saw', 'seeing', 'seen', 'seek', 'seeks', 'sought', 'seeking',
  'seem', 'seems', 'seemed', 'seeming', 'select', 'selects', 'selected', 'selecting',
  'sell', 'sells', 'sold', 'selling', 'send', 'sends', 'sent', 'sending',
  'sense', 'senses', 'sensed', 'sensing', 'separate', 'separates', 'separated', 'separating',
  'serve', 'serves', 'served', 'serving', 'set', 'sets', 'set', 'setting',
  'settle', 'settles', 'settled', 'settling', 'shake', 'shakes', 'shook', 'shaking', 'shaken',
  'shape', 'shapes', 'shaped', 'shaping', 'share', 'shares', 'shared', 'sharing',
  'shed', 'sheds', 'shed', 'shedding', 'shine', 'shines', 'shone', 'shining', 'shined',
  'ship', 'ships', 'shipped', 'shipping', 'shock', 'shocks', 'shocked', 'shocking',
  'shoot', 'shoots', 'shot', 'shooting', 'shop', 'shops', 'shopped', 'shopping',
  'shoulder', 'shoulders', 'shouldered', 'shouldering', 'shout', 'shouts', 'shouted', 'shouting',
  'show', 'shows', 'showed', 'showing', 'shown', 'shrink', 'shrinks', 'shrank', 'shrinking', 'shrunk',
  'shut', 'shuts', 'shut', 'shutting', 'sigh', 'sighs', 'sighed', 'sighing',
  'sign', 'signs', 'signed', 'signing', 'signal', 'signals', 'signaled', 'signaling',
  'silence', 'silences', 'silenced', 'silencing', 'sing', 'sings', 'sang', 'singing', 'sung',
  'sink', 'sinks', 'sank', 'sinking', 'sunk', 'sit', 'sits', 'sat', 'sitting',
  'skate', 'skates', 'skated', 'skating', 'ski', 'skis', 'skied', 'skiing',
  'skill', 'skills', 'skilled', 'skilling', 'skin', 'skins', 'skinned', 'skinning',
  'skip', 'skips', 'skipped', 'skipping', 'slap', 'slaps', 'slapped', 'slapping',
  'sleep', 'sleeps', 'slept', 'sleeping', 'slide', 'slides', 'slid', 'sliding',
  'slight', 'slights', 'slighted', 'slighting', 'slip', 'slips', 'slipped', 'slipping',
  'slow', 'slows', 'slowed', 'slowing', 'smell', 'smells', 'smelled', 'smelling', 'smelt',
  'smile', 'smiles', 'smiled', 'smiling', 'smoke', 'smokes', 'smoked', 'smoking',
  'smooth', 'smooths', 'smoothed', 'smoothing', 'snap', 'snaps', 'snapped', 'snapping',
  'snow', 'snows', 'snowed', 'snowing', 'soak', 'soaks', 'soaked', 'soaking',
  'solve', 'solves', 'solved', 'solving', 'sort', 'sorts', 'sorted', 'sorting',
  'sound', 'sounds', 'sounded', 'sounding', 'space', 'spaces', 'spaced', 'spacing',
  'spare', 'spares', 'spared', 'sparing', 'speak', 'speaks', 'spoke', 'speaking', 'spoken',
  'speed', 'speeds', 'sped', 'speeding', 'spell', 'spells', 'spelled', 'spelling', 'spelt',
  'spend', 'spends', 'spent', 'spending', 'spill', 'spills', 'spilled', 'spilling', 'spilt',
  'spin', 'spins', 'spun', 'spinning', 'spit', 'spits', 'spat', 'spitting',
  'split', 'splits', 'split', 'splitting', 'spoil', 'spoils', 'spoiled', 'spoiling', 'spoilt',
  'spot', 'spots', 'spotted', 'spotting', 'spray', 'sprays', 'sprayed', 'spraying',
  'spread', 'spreads', 'spread', 'spreading', 'spring', 'springs', 'sprang', 'springing', 'sprung',
  'square', 'squares', 'squared', 'squaring', 'squeeze', 'squeezes', 'squeezed', 'squeezing',
  'stain', 'stains', 'stained', 'staining', 'stamp', 'stamps', 'stamped', 'stamping',
  'stand', 'stands', 'stood', 'standing', 'stare', 'stares', 'stared', 'staring',
  'start', 'starts', 'started', 'starting', 'state', 'states', 'stated', 'stating',
  'station', 'stations', 'stationed', 'stationing', 'stay', 'stays', 'stayed', 'staying',
  'steal', 'steals', 'stole', 'stealing', 'stolen', 'steam', 'steams', 'steamed', 'steaming',
  'steer', 'steers', 'steered', 'steering', 'step', 'steps', 'stepped', 'stepping',
  'stick', 'sticks', 'stuck', 'sticking', 'sting', 'stings', 'stung', 'stinging',
  'stink', 'stinks', 'stank', 'stinking', 'stunk', 'stir', 'stirs', 'stirred', 'stirring',
  'stitch', 'stitches', 'stitched', 'stitching', 'stock', 'stocks', 'stocked', 'stocking',
  'stomach', 'stomachs', 'stomached', 'stomaching', 'stop', 'stops', 'stopped', 'stopping',
  'store', 'stores', 'stored', 'storing', 'storm', 'storms', 'stormed', 'storming',
  'story', 'stories', 'storied', 'storying', 'strain', 'strains', 'strained', 'straining',
  'strange', 'stranger', 'strangest', 'strangely', 'strap', 'straps', 'strapped', 'strapping',
  'stream', 'streams', 'streamed', 'streaming', 'street', 'streets', 'streeted', 'streeting',
  'strength', 'strengths', 'strengthened', 'strengthening', 'stress', 'stresses', 'stressed', 'stressing',
  'stretch', 'stretches', 'stretched', 'stretching', 'strike', 'strikes', 'struck', 'striking', 'stricken',
  'string', 'strings', 'strung', 'stringing', 'strip', 'strips', 'stripped', 'stripping',
  'stroke', 'strokes', 'stroked', 'stroking', 'strong', 'stronger', 'strongest', 'strongly',
  'structure', 'structures', 'structured', 'structuring', 'struggle', 'struggles', 'struggled', 'struggling',
  'study', 'studies', 'studied', 'studying', 'stuff', 'stuffs', 'stuffed', 'stuffing',
  'stumble', 'stumbles', 'stumbled', 'stumbling', 'subject', 'subjects', 'subjected', 'subjecting',
  'submit', 'submits', 'submitted', 'submitting', 'succeed', 'succeeds', 'succeeded', 'succeeding',
  'suck', 'sucks', 'sucked', 'sucking', 'suffer', 'suffers', 'suffered', 'suffering',
  'suggest', 'suggests', 'suggested', 'suggesting', 'suit', 'suits', 'suited', 'suiting',
  'sum', 'sums', 'summed', 'summing', 'summer', 'summers', 'summered', 'summering',
  'sun', 'suns', 'sunned', 'sunning', 'supply', 'supplies', 'supplied', 'supplying',
  'support', 'supports', 'supported', 'supporting', 'suppose', 'supposes', 'supposed', 'supposing',
  'sure', 'surer', 'surest', 'surely', 'surface', 'surfaces', 'surfaced', 'surfacing',
  'surprise', 'surprises', 'surprised', 'surprising', 'surround', 'surrounds', 'surrounded', 'surrounding',
  'survey', 'surveys', 'surveyed', 'surveying', 'suspect', 'suspects', 'suspected', 'suspecting',
  'suspend', 'suspends', 'suspended', 'suspending', 'swallow', 'swallows', 'swallowed', 'swallowing',
  'swear', 'swears', 'swore', 'swearing', 'sworn', 'sweat', 'sweats', 'sweated', 'sweating',
  'sweep', 'sweeps', 'swept', 'sweeping', 'swell', 'swells', 'swelled', 'swelling', 'swollen',
  'swim', 'swims', 'swam', 'swimming', 'swum', 'swing', 'swings', 'swung', 'swinging',
  'switch', 'switches', 'switched', 'switching', 'symbol', 'symbols', 'symboled', 'symboling',
  'sympathy', 'sympathies', 'sympathized', 'sympathizing', 'system', 'systems', 'systemed', 'systeming',
  'table', 'tables', 'tabled', 'tabling', 'tackle', 'tackles', 'tackled', 'tackling',
  'tag', 'tags', 'tagged', 'tagging', 'tail', 'tails', 'tailed', 'tailing',
  'take', 'takes', 'took', 'taking', 'taken', 'talk', 'talks', 'talked', 'talking',
  'tall', 'taller', 'tallest', 'tallly', 'tank', 'tanks', 'tanked', 'tanking',
  'tap', 'taps', 'tapped', 'tapping', 'tape', 'tapes', 'taped', 'taping',
  'target', 'targets', 'targeted', 'targeting', 'task', 'tasks', 'tasked', 'tasking',
  'taste', 'tastes', 'tasted', 'tasting', 'tax', 'taxes', 'taxed', 'taxing',
  'teach', 'teaches', 'taught', 'teaching', 'team', 'teams', 'teamed', 'teaming',
  'tear', 'tears', 'tore', 'tearing', 'torn', 'tease', 'teases', 'teased', 'teasing',
  'telephone', 'telephones', 'telephoned', 'telephoning', 'tell', 'tells', 'told', 'telling',
  'temper', 'tempers', 'tempered', 'tempering', 'tempt', 'tempts', 'tempted', 'tempting',
  'tend', 'tends', 'tended', 'tending', 'tense', 'tenses', 'tensed', 'tensing',
  'term', 'terms', 'termed', 'terming', 'test', 'tests', 'tested', 'testing',
  'text', 'texts', 'texted', 'texting', 'thank', 'thanks', 'thanked', 'thanking',
  'theater', 'theaters', 'theatered', 'theatering', 'theory', 'theories', 'theoried', 'theorying',
  'thick', 'thicker', 'thickest', 'thickly', 'thin', 'thinner', 'thinnest', 'thinly',
  'thing', 'things', 'thinged', 'thinging', 'think', 'thinks', 'thought', 'thinking',
  'third', 'thirds', 'thirded', 'thirding', 'thirst', 'thirsts', 'thirsted', 'thirsting',
  'thirty', 'thirties', 'thirtied', 'thirtying', 'this', 'thiss', 'thissed', 'thissing',
  'thorough', 'thoroughly', 'those', 'thoses', 'thosed', 'thosing',
  'though', 'thoughs', 'thoughed', 'thoughing', 'thought', 'thoughts', 'thoughted', 'thoughting',
  'thousand', 'thousands', 'thousanded', 'thousanding', 'thread', 'threads', 'threaded', 'threading',
  'threat', 'threats', 'threatened', 'threatening', 'three', 'threes', 'threed', 'threeing',
  'threw', 'threws', 'threwed', 'threwing', 'throat', 'throats', 'throated', 'throating',
  'through', 'throughs', 'throughed', 'throughing', 'throw', 'throws', 'threw', 'throwing', 'thrown',
  'thumb', 'thumbs', 'thumbed', 'thumbing', 'thunder', 'thunders', 'thundered', 'thundering',
  'thursday', 'thursdays', 'thursdayed', 'thursdaying', 'thus', 'thuss', 'thussed', 'thussing',
  'ticket', 'tickets', 'ticketed', 'ticketing', 'tide', 'tides', 'tided', 'tiding',
  'tidy', 'tidies', 'tidied', 'tidying', 'tie', 'ties', 'tied', 'tying',
  'tight', 'tighter', 'tightest', 'tightly', 'till', 'tills', 'tilled', 'tilling',
  'time', 'times', 'timed', 'timing', 'tin', 'tins', 'tinned', 'tinning',
  'tiny', 'tinier', 'tiniest', 'tinily', 'tip', 'tips', 'tipped', 'tipping',
  'tire', 'tires', 'tired', 'tiring', 'title', 'titles', 'titled', 'titling',
  'to', 'tos', 'toed', 'toing', 'toast', 'toasts', 'toasted', 'toasting',
  'tobacco', 'tobaccos', 'tobaccoed', 'tobaccoing', 'today', 'todays', 'todayed', 'todaying',
  'toe', 'toes', 'toed', 'toing', 'together', 'togethers', 'togethered', 'togethering',
  'toilet', 'toilets', 'toileted', 'toileting', 'tomato', 'tomatoes', 'tomatoed', 'tomatoing',
  'tomorrow', 'tomorrows', 'tomorrowed', 'tomorrowing', 'tone', 'tones', 'toned', 'toning',
  'tongue', 'tongues', 'tongued', 'tonguing', 'tonight', 'tonights', 'tonighted', 'tonighting',
  'too', 'toos', 'tooed', 'tooing', 'tool', 'tools', 'tooled', 'tooling',
  'tooth', 'teeth', 'toothed', 'toothing', 'top', 'tops', 'topped', 'topping',
  'topic', 'topics', 'topiced', 'topicing', 'total', 'totals', 'totaled', 'totaling',
  'touch', 'touches', 'touched', 'touching', 'tough', 'tougher', 'toughest', 'toughly',
  'tour', 'tours', 'toured', 'touring', 'toward', 'towards', 'towarded', 'towarding',
  'towel', 'towels', 'toweled', 'toweling', 'tower', 'towers', 'towered', 'towering',
  'town', 'towns', 'towned', 'towning', 'toy', 'toys', 'toyed', 'toying',
  'trace', 'traces', 'traced', 'tracing', 'track', 'tracks', 'tracked', 'tracking',
  'trade', 'trades', 'traded', 'trading', 'tradition', 'traditions', 'traditioned', 'traditioning',
  'traffic', 'traffics', 'trafficked', 'trafficking', 'train', 'trains', 'trained', 'training',
  'transfer', 'transfers', 'transferred', 'transferring', 'transform', 'transforms', 'transformed', 'transforming',
  'translate', 'translates', 'translated', 'translating', 'transport', 'transports', 'transported', 'transporting',
  'trap', 'traps', 'trapped', 'trapping', 'travel', 'travels', 'traveled', 'traveling', 'travelled', 'travelling',
  'treat', 'treats', 'treated', 'treating', 'tree', 'trees', 'treed', 'treeing',
  'tremble', 'trembles', 'trembled', 'trembling', 'trend', 'trends', 'trended', 'trending',
  'trial', 'trials', 'trialed', 'trialing', 'tribe', 'tribes', 'tribed', 'tribing',
  'trick', 'tricks', 'tricked', 'tricking', 'trip', 'trips', 'tripped', 'tripping',
  'troop', 'troops', 'trooped', 'trooping', 'trouble', 'troubles', 'troubled', 'troubling',
  'truck', 'trucks', 'trucked', 'trucking', 'true', 'truer', 'truest', 'truly',
  'trust', 'trusts', 'trusted', 'trusting', 'truth', 'truths', 'truthed', 'truthing',
  'try', 'tries', 'tried', 'trying', 'tube', 'tubes', 'tubed', 'tubing',
  'tuesday', 'tuesdays', 'tuesdayed', 'tuesdaying', 'tune', 'tunes', 'tuned', 'tuning',
  'tunnel', 'tunnels', 'tunneled', 'tunneling', 'turn', 'turns', 'turned', 'turning',
  'tv', 'tvs', 'tved', 'tving', 'twelve', 'twelves', 'twelved', 'twelving',
  'twenty', 'twenties', 'twentied', 'twentying', 'twice', 'twices', 'twiced', 'twicing',
  'twin', 'twins', 'twinned', 'twinning', 'twist', 'twists', 'twisted', 'twisting',
  'two', 'twos', 'twoed', 'twoing', 'type', 'types', 'typed', 'typing',
  'typical', 'typically', 'ugly', 'uglier', 'ugliest', 'uglily',
  'umbrella', 'umbrellas', 'umbrellaed', 'umbrellaing', 'unable', 'unabler', 'unablest', 'unably',
  'uncle', 'uncles', 'uncled', 'uncling', 'under', 'unders', 'undered', 'undering',
  'underneath', 'underneaths', 'underneathed', 'underneathing', 'understand', 'understands', 'understood', 'understanding',
  'underwear', 'underwears', 'underweared', 'underwearing', 'undo', 'undos', 'undid', 'undoing', 'undone',
  'unemployment', 'unemployments', 'unemploymented', 'unemploymenting', 'unexpected', 'unexpectedly',
  'unfair', 'unfairer', 'unfairest', 'unfairly', 'unfortunate', 'unfortunately',
  'unhappy', 'unhappier', 'unhappiest', 'unhappily', 'uniform', 'uniforms', 'uniformed', 'uniforming',
  'union', 'unions', 'unioned', 'unioning', 'unique', 'uniquer', 'uniquest', 'uniquely',
  'unit', 'units', 'united', 'uniting', 'universe', 'universes', 'universed', 'universing',
  'university', 'universities', 'universitied', 'universitying', 'unknown', 'unknowns', 'unknowned', 'unknowning',
  'unless', 'unlesss', 'unlessed', 'unlessing', 'unlike', 'unlikes', 'unliked', 'unliking',
  'unlikely', 'unlikelier', 'unlikeliest', 'unlikelily', 'unload', 'unloads', 'unloaded', 'unloading',
  'until', 'untils', 'untiled', 'untilting', 'unusual', 'unusualer', 'unusualest', 'unusually',
  'up', 'ups', 'upped', 'upping', 'upon', 'upons', 'uponed', 'uponing',
  'upper', 'uppers', 'uppered', 'uppering', 'upset', 'upsets', 'upset', 'upsetting',
  'upstairs', 'upstairss', 'upstairssed', 'upstairssing', 'urban', 'urbans', 'urbaned', 'urbaning',
  'urge', 'urges', 'urged', 'urging', 'urgent', 'urgenter', 'urgentest', 'urgently',
  'us', 'uss', 'used', 'using', 'used', 'useds', 'useded', 'useding',
  'useful', 'usefuller', 'usefullest', 'usefully', 'useless', 'uselesser', 'uselessest', 'uselessly',
  'user', 'users', 'usered', 'usering', 'usual', 'usualer', 'usualest', 'usually',
  'valley', 'valleys', 'valleyed', 'valleying', 'valuable', 'valuabler', 'valuablest', 'valuably',
  'value', 'values', 'valued', 'valuing', 'van', 'vans', 'vaned', 'vaning',
  'variety', 'varieties', 'varietied', 'varietying', 'various', 'variouser', 'variousest', 'variously',
  'vast', 'vaster', 'vastest', 'vastly', 'vegetable', 'vegetables', 'vegetabled', 'vegetabling',
  'vehicle', 'vehicles', 'vehicled', 'vehicling', 'version', 'versions', 'versioned', 'versioning',
  'versus', 'versuss', 'versussed', 'versussing', 'very', 'verier', 'veriest', 'veryly',
  'via', 'vias', 'viaed', 'viaing', 'victim', 'victims', 'victimed', 'victiming',
  'victory', 'victories', 'victoried', 'victorying', 'video', 'videos', 'videoed', 'videoing',
  'view', 'views', 'viewed', 'viewing', 'village', 'villages', 'villaged', 'villaging',
  'violence', 'violences', 'violenced', 'violencing', 'violent', 'violenter', 'violentest', 'violently',
  'virtual', 'virtualer', 'virtualest', 'virtually', 'virus', 'viruses', 'virused', 'virusing',
  'visa', 'visas', 'visaed', 'visaing', 'visit', 'visits', 'visited', 'visiting',
  'visitor', 'visitors', 'visitored', 'visitoring', 'visual', 'visuals', 'visualed', 'visualing',
  'vital', 'vitaler', 'vitalest', 'vitally', 'voice', 'voices', 'voiced', 'voicing',
  'volume', 'volumes', 'volumed', 'voluming', 'volunteer', 'volunteers', 'volunteered', 'volunteering',
  'vote', 'votes', 'voted', 'voting', 'wage', 'wages', 'waged', 'waging',
  'wait', 'waits', 'waited', 'waiting', 'wake', 'wakes', 'woke', 'waking', 'woken',
  'walk', 'walks', 'walked', 'walking', 'wall', 'walls', 'walled', 'walling',
  'wander', 'wanders', 'wandered', 'wandering', 'want', 'wants', 'wanted', 'wanting',
  'war', 'wars', 'wared', 'waring', 'warm', 'warmer', 'warmest', 'warmly',
  'warn', 'warns', 'warned', 'warning', 'wash', 'washes', 'washed', 'washing',
  'waste', 'wastes', 'wasted', 'wasting', 'watch', 'watches', 'watched', 'watching',
  'water', 'waters', 'watered', 'watering', 'wave', 'waves', 'waved', 'waving',
  'way', 'ways', 'wayed', 'waying', 'we', 'wes', 'weed', 'weeding',
  'weak', 'weaker', 'weakest', 'weakly', 'wealth', 'wealths', 'wealthed', 'wealthing',
  'weapon', 'weapons', 'weaponed', 'weaponing', 'wear', 'wears', 'wore', 'wearing', 'worn',
  'weather', 'weathers', 'weathered', 'weathering', 'web', 'webs', 'webbed', 'webbing',
  'website', 'websites', 'websited', 'websiting', 'wedding', 'weddings', 'weddinged', 'weddinging',
  'wednesday', 'wednesdays', 'wednesdayed', 'wednesdaying', 'week', 'weeks', 'weeked', 'weeking',
  'weekend', 'weekends', 'weekended', 'weekending', 'weekly', 'weeklies', 'weeklied', 'weeklying',
  'weigh', 'weighs', 'weighed', 'weighing', 'weight', 'weights', 'weighted', 'weighting',
  'welcome', 'welcomes', 'welcomed', 'welcoming', 'welfare', 'welfares', 'welfared', 'welfaring',
  'well', 'wells', 'welled', 'welling', 'west', 'wests', 'wested', 'westing',
  'western', 'westerns', 'westerned', 'westerning', 'wet', 'wetter', 'wettest', 'wetly',
  'what', 'whats', 'whated', 'whating', 'whatever', 'whatevers', 'whatevered', 'whatevering',
  'wheel', 'wheels', 'wheeled', 'wheeling', 'when', 'whens', 'whened', 'whening',
  'whenever', 'whenevers', 'whenevered', 'whenevering', 'where', 'wheres', 'whered', 'whereing',
  'whereas', 'whereass', 'whereased', 'whereasing', 'wherever', 'wherevers', 'wherevered', 'wherevering',
  'whether', 'whethers', 'whetherd', 'whethering', 'which', 'whichs', 'whiched', 'whiching',
  'while', 'whiles', 'whiled', 'whiling', 'whisper', 'whispers', 'whispered', 'whispering',
  'white', 'whites', 'whited', 'whiting', 'who', 'whos', 'whoed', 'whoing',
  'whole', 'wholes', 'wholed', 'wholing', 'whom', 'whoms', 'whomed', 'whoming',
  'whose', 'whoses', 'whosed', 'whosing', 'why', 'whys', 'whyed', 'whying',
  'wide', 'wider', 'widest', 'widely', 'wife', 'wives', 'wifed', 'wiving',
  'wild', 'wilder', 'wildest', 'wildly', 'will', 'wills', 'willed', 'willing',
  'willing', 'willinger', 'willingest', 'willingly', 'win', 'wins', 'won', 'winning',
  'wind', 'winds', 'wound', 'winding', 'window', 'windows', 'windowed', 'windowing',
  'wine', 'wines', 'wined', 'wining', 'wing', 'wings', 'winged', 'winging',
  'winner', 'winners', 'winnered', 'winnering', 'winter', 'winters', 'wintered', 'wintering',
  'wipe', 'wipes', 'wiped', 'wiping', 'wire', 'wires', 'wired', 'wiring',
  'wise', 'wiser', 'wisest', 'wisely', 'wish', 'wishes', 'wished', 'wishing',
  'with', 'withs', 'withed', 'withing', 'within', 'withins', 'withined', 'withining',
  'without', 'withouts', 'withouted', 'withouting', 'witness', 'witnesses', 'witnessed', 'witnessing',
  'woman', 'women', 'womaned', 'womaning', 'wonder', 'wonders', 'wondered', 'wondering',
  'wonderful', 'wonderfuller', 'wonderfullest', 'wonderfully', 'wood', 'woods', 'wooded', 'wooding',
  'wooden', 'woodens', 'woodened', 'woodening', 'wool', 'wools', 'wooled', 'wooling',
  'word', 'words', 'worded', 'wording', 'work', 'works', 'worked', 'working',
  'worker', 'workers', 'workered', 'workering', 'workshop', 'workshops', 'workshopped', 'workshopping',
  'world', 'worlds', 'worlded', 'worlding', 'worried', 'worrier', 'worriest', 'worriedly',
  'worry', 'worries', 'worried', 'worrying', 'worse', 'worses', 'worsed', 'worsing',
  'worth', 'worths', 'worthed', 'worthing', 'would', 'woulds', 'woulded', 'woulding',
  'wound', 'wounds', 'wounded', 'wounding', 'wrap', 'wraps', 'wrapped', 'wrapping',
  'write', 'writes', 'wrote', 'writing', 'written', 'wrong', 'wrongs', 'wronged', 'wronging',
  'yard', 'yards', 'yarded', 'yarding', 'yeah', 'yeahs', 'yeahed', 'yeahing',
  'year', 'years', 'yeared', 'yearing', 'yellow', 'yellows', 'yellowed', 'yellowing',
  'yes', 'yess', 'yessed', 'yessing', 'yesterday', 'yesterdays', 'yesterdayed', 'yesterdaying',
  'yet', 'yets', 'yeted', 'yeting', 'you', 'yous', 'youed', 'youing',
  'young', 'younger', 'youngest', 'youngly', 'your', 'yours', 'youred', 'youring',
  'yourself', 'yourselves', 'yourselved', 'yourselfing', 'youth', 'youths', 'youthed', 'youthing',
  'zone', 'zones', 'zoned', 'zoning',
])

// Known nickname mappings (canonical -> variants)
const NICKNAME_MAP: Record<string, string[]> = {
  // User-specified mappings
  'jacinta': ['jac', 'jaci'],
  'bret': ['bretin'],
  'jocelyn': ['joc'],
  'danny': ['dander'],
  'andy': ['temp'],
  'etan': ['ethan'],
  'chuck': ['charlie'],
  'jim': ['jimbob'],
  'jason': ['boss'],
  // Also map reverse (variant -> canonical) for easier lookup
  'dander': ['danny'],
  'jimbob': ['jim'],
  'boss': ['jason'],
  // Common name mappings
  'andrea': ['drea', 'andie'],
  'alexander': ['alex'],
  'alexandra': ['alex'],
  'christopher': ['chris'],
  'christina': ['chris', 'tina'],
  'michael': ['mike', 'mikey'],
  'jennifer': ['jen', 'jenny'],
  'daniel': ['dan'],
  'robert': ['rob', 'bob', 'bobby'],
  'william': ['will', 'bill'],
  'richard': ['rich', 'rick', 'dick'],
  'joseph': ['joe'],
  'thomas': ['tom', 'tommy'],
  'james': ['jimmy'],
  'elizabeth': ['liz', 'lizzie', 'beth'],
  'patricia': ['pat', 'patti'],
  'catherine': ['cathy', 'cate', 'kate'],
  'rebecca': ['becca', 'becky'],
}

// Check if one name is a nickname of another
function isNickname(shortName: string, longName: string): boolean {
  const short = shortName.toLowerCase()
  const long = longName.toLowerCase()

  // Check if short is a prefix of long (e.g., "jac" -> "jacinta")
  if (long.startsWith(short) && short.length >= 3) {
    return true
  }

  // Check known nickname mappings
  const longVariants = NICKNAME_MAP[long] || []
  if (longVariants.includes(short)) return true

  const shortVariants = NICKNAME_MAP[short] || []
  if (shortVariants.some(v => v === long || long.startsWith(v))) return true

  return false
}

// Normalize name to proper case (first letter capitalized, rest lowercase)
function normalizeName(name: string): string {
  if (!name || name.length === 0) return name
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
}

// Simple NER-like person detection
// This is a simplified approach - in production you'd use spaCy, Stanford NER, or similar
function extractPersonNames(text: string, artistName?: string): string[] {
  if (!text || text.trim().length === 0) return []

  // Remove artist name if provided (to avoid false positives)
  let cleanedText = text.toLowerCase()
  if (artistName) {
    const artistWords = artistName.toLowerCase().split(/\s+/)
    artistWords.forEach(word => {
      cleanedText = cleanedText.replace(new RegExp(`\\b${word}\\b`, 'gi'), '')
    })
  }

  // Split into sentences and tokens
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const names: Set<string> = new Set()

  sentences.forEach(sentence => {
    // Look for patterns like "with X", "saw X", "hung out with X", "X and Y"
    // Case-insensitive patterns
    const withPattern = /\b(?:with|saw|met|hung out with|spent time with|chilled with|talked to|called|texted|dm'd|dmed)\s+([a-z]+(?:\s+[a-z]+)?)/gi
    const andPattern = /\b([a-z]+)\s+and\s+([a-z]+)/gi
    const commaPattern = /\b([a-z]+)\s*,\s*([a-z]+)/gi

    // Extract from "with X" patterns (case-insensitive)
    let match
    while ((match = withPattern.exec(sentence)) !== null) {
      const name = normalizeName(match[1].trim())
      if (isValidPersonName(name)) {
        names.add(name)
      }
    }

    // Extract from "X and Y" patterns (case-insensitive)
    while ((match = andPattern.exec(sentence)) !== null) {
      const name1 = normalizeName(match[1].trim())
      const name2 = normalizeName(match[2].trim())
      if (isValidPersonName(name1)) names.add(name1)
      if (isValidPersonName(name2)) names.add(name2)
    }

    // Extract from "X, Y" patterns (case-insensitive)
    while ((match = commaPattern.exec(sentence)) !== null) {
      const name1 = normalizeName(match[1].trim())
      const name2 = normalizeName(match[2].trim())
      if (isValidPersonName(name1)) names.add(name1)
      if (isValidPersonName(name2)) names.add(name2)
    }

    // Also look for words that might be names (case-insensitive, but check context)
    const words = sentence.split(/\s+/)
    words.forEach((word, index) => {
      const cleaned = word.replace(/[.,!?;:]/g, '').toLowerCase()
      if (
        cleaned.length >= 3 &&
        /^[a-z]+$/.test(cleaned) &&
        !FALSE_POSITIVES.has(cleaned) &&
        index > 0 && // Not first word (likely sentence start)
        (words[index - 1]?.toLowerCase().match(/\b(with|and|,)\b/) || 
         words[index + 1]?.toLowerCase() === 'and')
      ) {
        const normalized = normalizeName(cleaned)
        if (isValidPersonName(normalized)) {
          names.add(normalized)
        }
      }
    })
  })

  return Array.from(names)
}

function isValidPersonName(name: string): boolean {
  if (!name || name.length < 3) return false
  if (name.length > 50) return false
  if (FALSE_POSITIVES.has(name.toLowerCase())) return false
  // Must start with capital letter and be alphabetic
  if (!/^[A-Z][a-z]+$/.test(name)) return false
  return true
}

// Calculate similarity between two names
function nameSimilarity(name1: string, name2: string): number {
  const n1 = name1.toLowerCase()
  const n2 = name2.toLowerCase()

  // Exact match
  if (n1 === n2) return 1.0

  // Check if one is a nickname of the other (highest priority)
  if (isNickname(n1, n2) || isNickname(n2, n1)) return 0.95

  // One is prefix of the other (but not caught by nickname check)
  if (n1.startsWith(n2) || n2.startsWith(n1)) {
    const shorter = n1.length < n2.length ? n1 : n2
    const longer = n1.length > n2.length ? n1 : n2
    // Higher similarity if prefix is at least 3 chars
    return shorter.length >= 3 ? 0.85 : 0.7
  }

  // Levenshtein-like simple similarity
  const longer = n1.length > n2.length ? n1 : n2
  const shorter = n1.length > n2.length ? n2 : n1
  const editDistance = levenshteinDistance(n1, n2)
  const similarity = 1 - editDistance / longer.length

  return similarity
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  return matrix[str2.length][str1.length]
}

// Group similar names
function groupSimilarNames(detections: Map<string, { entries: string[], count: number }>): Map<string, string[]> {
  const groups = new Map<string, string[]>()
  const processed = new Set<string>()

  const names = Array.from(detections.keys())

  // First pass: group known nicknames together (priority)
  const nicknameGroups = new Map<string, Set<string>>()
  const allNicknameNames = new Set<string>() // Track all names that are part of nickname groups
  
  names.forEach(name => {
    const nameLower = name.toLowerCase()
    // Check if this name is a known canonical
    if (NICKNAME_MAP[nameLower]) {
      if (!nicknameGroups.has(nameLower)) {
        nicknameGroups.set(nameLower, new Set([name]))
        allNicknameNames.add(name)
      }
      // Add all variants
      NICKNAME_MAP[nameLower].forEach(variant => {
        const variantName = names.find(n => n.toLowerCase() === variant)
        if (variantName) {
          nicknameGroups.get(nameLower)!.add(variantName)
          allNicknameNames.add(variantName)
        }
      })
    }
    // Check if this name is a known variant
    Object.entries(NICKNAME_MAP).forEach(([canonical, variants]) => {
      if (variants.includes(nameLower)) {
        if (!nicknameGroups.has(canonical)) {
          const canonicalName = names.find(n => n.toLowerCase() === canonical)
          if (canonicalName) {
            nicknameGroups.set(canonical, new Set([canonicalName]))
            allNicknameNames.add(canonicalName)
          }
        }
        if (nicknameGroups.has(canonical)) {
          nicknameGroups.get(canonical)!.add(name)
          allNicknameNames.add(name)
        }
      }
    })
  })

  // Merge nickname groups into main groups (ensure canonical is used)
  nicknameGroups.forEach((nameSet, canonical) => {
    // Find the actual canonical name in the set (case-insensitive)
    const canonicalName = Array.from(nameSet).find(n => n.toLowerCase() === canonical) || Array.from(nameSet)[0]
    groups.set(canonicalName, Array.from(nameSet))
    nameSet.forEach(n => processed.add(n))
  })

  // Second pass: group remaining names by similarity
  names.forEach(name => {
    if (processed.has(name)) return

    const group: string[] = [name]
    processed.add(name)

    // Find similar names (excluding already processed)
    names.forEach(otherName => {
      if (processed.has(otherName)) return
      if (allNicknameNames.has(otherName)) return // Skip names that are part of nickname groups
      
      // Skip if they're known nicknames (already handled)
      if (isNickname(name, otherName) || isNickname(otherName, name)) {
        return
      }
      
      const similarity = nameSimilarity(name, otherName)
      // Lower threshold for nickname detection (0.65) vs general similarity (0.7)
      if (similarity >= 0.65) {
        group.push(otherName)
        processed.add(otherName)
      }
    })

    // Prioritize known canonical names from NICKNAME_MAP
    const knownCanonicals = Object.keys(NICKNAME_MAP)
    let canonical = group.find(name => knownCanonicals.includes(name.toLowerCase()))
    
    if (!canonical) {
      // If no known canonical, prefer longer name if counts are similar
      canonical = group.reduce((a, b) => {
        const countA = detections.get(a)?.count || 0
        const countB = detections.get(b)?.count || 0
        // If counts are close (within 2), prefer longer name
        if (Math.abs(countA - countB) <= 2) {
          return b.length > a.length ? b : a
        }
        // Otherwise prefer more common
        return countB > countA ? b : a
      })
    } else {
      // Found a known canonical, make sure it's in the group (case-insensitive match)
      const canonicalLower = canonical.toLowerCase()
      canonical = group.find(name => name.toLowerCase() === canonicalLower) || group[0]
    }

    groups.set(canonical, group)
  })

  return groups
}

interface DetectionResult {
  entryId: string
  date: string
  songTitle: string
  artist: string
  detectedNames: string[]
}

async function autoDetectPeople(dryRun: boolean = true, userId?: string) {
  console.log(`\n🔍 Auto-detecting people from notes...`)
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'APPLY (will create records)'}\n`)

  // Get all entries with notes but no people references
  const entries = await prisma.entry.findMany({
    where: {
      notes: { not: null },
      people: { none: {} }, // No existing people references
      ...(userId ? { userId } : {}),
    },
    include: {
      people: true,
    },
    orderBy: {
      date: 'desc',
    },
  })

  console.log(`Found ${entries.length} entries with notes and no existing people tags\n`)

  const detections = new Map<string, { entries: string[], count: number }>()
  const entryResults: DetectionResult[] = []

  // Process each entry
  for (const entry of entries) {
    if (!entry.notes) continue

    const detectedNames = extractPersonNames(entry.notes, entry.artist)
    
    if (detectedNames.length > 0) {
      entryResults.push({
        entryId: entry.id,
        date: entry.date.toISOString().split('T')[0],
        songTitle: entry.songTitle,
        artist: entry.artist,
        detectedNames,
      })

      // Count occurrences
      detectedNames.forEach(name => {
        const existing = detections.get(name) || { entries: [], count: 0 }
        existing.entries.push(entry.id)
        existing.count++
        detections.set(name, existing)
      })
    }
  }

  // Group similar names first (before filtering by count)
  const nameGroups = groupSimilarNames(detections)

  // Merge counts for grouped names
  const mergedDetections = new Map<string, { entries: string[], count: number }>()
  
  nameGroups.forEach((aliases, canonical) => {
    const allEntries = new Set<string>()
    let totalCount = 0
    
    aliases.forEach(alias => {
      const data = detections.get(alias)
      if (data) {
        data.entries.forEach(e => allEntries.add(e))
        totalCount += data.count
      }
    })
    
    // Only include if merged count is ≥2
    if (totalCount >= 2) {
      mergedDetections.set(canonical, {
        entries: Array.from(allEntries),
        count: totalCount,
      })
    }
  })

  // Filter: only keep names that appear in ≥2 entries (after merging)
  const filteredDetections = mergedDetections

  console.log(`\n📊 Detection Summary:`)
  console.log(`Total names detected: ${detections.size}`)
  console.log(`Names appearing ≥2 times (after merging): ${filteredDetections.size}`)
  console.log(`Entries with detections: ${entryResults.length}\n`)

  console.log(`\n👥 Similar Name Groups (merged):`)
  const groupsWithAliases = Array.from(nameGroups.entries()).filter(([canonical, aliases]) => {
    // Only show groups that are in filteredDetections (merged count ≥2)
    return aliases.length > 1 && filteredDetections.has(canonical)
  })
  console.log(`Found ${groupsWithAliases.length} groups with multiple aliases\n`)

  groupsWithAliases.forEach(([canonical, aliases]) => {
    const data = filteredDetections.get(canonical)
    console.log(`  "${canonical}" (canonical, ${data?.count || 0} total entries)`)
    aliases.filter(a => a !== canonical).forEach(alias => {
      const aliasData = detections.get(alias)
      if (aliasData) {
        console.log(`    - "${alias}" (${aliasData.count} entries)`)
      }
    })
    console.log()
  })

  // Map aliases to canonical names for display
  const aliasToCanonical = new Map<string, string>()
  nameGroups.forEach((aliases, canonical) => {
    aliases.forEach(alias => {
      aliasToCanonical.set(alias, canonical)
    })
  })

  // Show sample detections
  console.log(`\n📝 Sample Detections (first 10 entries):`)
  entryResults.slice(0, 10).forEach(result => {
    // Map detected names to canonical names
    const canonicalNames = new Set<string>()
    result.detectedNames.forEach(name => {
      const canonical = aliasToCanonical.get(name) || name
      if (filteredDetections.has(canonical)) {
        canonicalNames.add(canonical)
      }
    })
    if (canonicalNames.size > 0) {
      console.log(`  ${result.date}: "${result.songTitle}" by ${result.artist}`)
      console.log(`    → ${Array.from(canonicalNames).join(', ')}`)
    }
  })

  if (entryResults.length > 10) {
    console.log(`  ... and ${entryResults.length - 10} more entries`)
  }

  // Show all names that will be created (with aliases if any)
  console.log(`\n\n✅ Names that will be created (${filteredDetections.size}):`)
  Array.from(filteredDetections.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([canonical, data]) => {
      const aliases = nameGroups.get(canonical) || [canonical]
      if (aliases.length > 1) {
        console.log(`  "${canonical}" (includes: ${aliases.filter(a => a !== canonical).join(', ')}): ${data.count} entries`)
      } else {
        console.log(`  "${canonical}": ${data.count} entries`)
      }
    })

  if (dryRun) {
    console.log(`\n\n⚠️  DRY RUN - No changes made. Run with --apply to create records.`)
  } else {
    console.log(`\n\n💾 APPLYING changes...`)

    let created = 0
    let skipped = 0

    // Map aliases to canonical names
    const aliasToCanonical = new Map<string, string>()
    nameGroups.forEach((aliases, canonical) => {
      aliases.forEach(alias => {
        aliasToCanonical.set(alias, canonical)
      })
    })

    for (const result of entryResults) {
      // Map detected names to canonical names (handling nicknames)
      const canonicalNames = new Set<string>()
      result.detectedNames.forEach(name => {
        const canonical = aliasToCanonical.get(name) || name
        if (filteredDetections.has(canonical)) {
          canonicalNames.add(canonical)
        }
      })
      
      for (const canonicalName of canonicalNames) {
        try {
          await prisma.personReference.create({
            data: {
              entryId: result.entryId,
              name: canonicalName,
              source: 'auto_migration',
            },
          })
          created++
        } catch (error: any) {
          // Skip if already exists (shouldn't happen, but just in case)
          if (error.code === 'P2002') {
            skipped++
          } else {
            console.error(`Error creating PersonReference for "${canonicalName}" in entry ${result.entryId}:`, error)
          }
        }
      }
    }

    console.log(`\n✅ Created ${created} PersonReference records`)
    if (skipped > 0) {
      console.log(`⚠️  Skipped ${skipped} (already existed)`)
    }
  }

  console.log(`\n`)
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--apply')
  const userIdArg = args.find(arg => arg.startsWith('--userId='))
  const userId = userIdArg ? userIdArg.split('=')[1] : undefined

  try {
    await autoDetectPeople(dryRun, userId)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

