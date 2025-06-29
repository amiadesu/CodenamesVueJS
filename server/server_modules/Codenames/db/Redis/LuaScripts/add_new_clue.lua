-- KEYS[1] - clues key
-- KEYS[2] - updated at key
-- ARGV[1] - teamColor (string)
-- ARGV[2] - newClue (JSON string)
-- ARGV[3] - clues limit (string)
-- ARGV[4] - expire time in seconds (string)
-- ARGV[5] - updated at value (string)

-- Check if data exists
local clues = redis.call('GET', KEYS[1])

if not clues then
    return {err = "Data not found in Redis"}
end

-- Decode JSON data
clues = cjson.decode(clues)

-- Decode selector
local teamColor = ARGV[1]
local newClue = cjson.decode(ARGV[2])

if not teamColor or not newClue then
    return {err = "Invalid parameters"}
end

if clues[teamColor] == nil then
    return {err = "Invalid team color"}
end

-- Add selector
table.insert(clues[teamColor], newClue)
if #clues[teamColor] > tonumber(ARGV[3]) then
    table.remove(clues[teamColor], 1)
end

-- Ensure the entire structure maintains array types
setmetatable(clues, cjson.array_mt)

-- Update Redis
redis.call('SET', KEYS[1], cjson.encode(clues), 'EX', ARGV[4])

-- version increment and updatedAt set
redis.call('SET', KEYS[#KEYS], ARGV[#ARGV], 'EX', ARGV[4])

return {ok = "End turn selector added successfully"}