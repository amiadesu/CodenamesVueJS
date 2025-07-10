-- KEYS[1] - clues key
-- KEYS[2] - updated at key
-- ARGV[1] - clueId (string)
-- ARGV[2] - newClue (JSON string)
-- ARGV[3] - expire time in seconds (string)
-- ARGV[4] - updated at value (string)

-- Check if data exists
local clues = redis.call('GET', KEYS[1])

if not clues then
    return {err = "Data not found in Redis"}
end

-- Decode JSON data
clues = cjson.decode(clues)

-- Decode selector
local clueId = ARGV[1]
local newClue = cjson.decode(ARGV[2])

if not clueId or not newClue then
    return {err = "Invalid parameters"}
end

-- Check for existing selector
local teamColor = ""
local clueIndex = -1
for team, cluesList in pairs(clues) do
    for i, clue in ipairs(cluesList) do
        if tostring(clue.id) == clueId then
            teamColor = team
            clueIndex = i
            break
        end
    end
    if (clueIndex ~= -1) then
        break
    end
end

if teamColor == "" or clueIndex == -1 then
    return {err = "Clue with such index wasn't found"}
end

-- Update clue
clues[teamColor][clueIndex] = newClue

-- Ensure the entire structure maintains array types
-- Helper: force empty arrays to stay arrays
local function force_empty_array(t)
    if type(t) == "table" and #t == 0 then
        t[1] = "__DUMMY__"
        return true
    end
    return false
end

-- Fix empty fields
for team, cluesList in pairs(clues) do
    force_empty_array(clues[team])
end

-- Encode words
local encoded = cjson.encode(clues)

-- Clean up dummy ["__DUMMY__"] → []
encoded = string.gsub(encoded, '%["__DUMMY__"%]', '[]')

-- Update Redis
redis.call('SET', KEYS[1], encoded, 'EX', ARGV[3])

-- version increment and updatedAt set
redis.call('SET', KEYS[#KEYS], ARGV[#ARGV], 'EX', ARGV[3])

return {ok = "End turn selector added successfully"}