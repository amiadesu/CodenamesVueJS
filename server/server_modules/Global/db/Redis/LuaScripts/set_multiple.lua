-- KEYS[1..n] - list of keys
-- KEY[n+1] - updated at key
-- ARGV[1..n] - list of args
-- ARGV[n+1] - expire time in seconds (string)
-- ARGV[n+2] - updated at value (string)

-- Check if data exists
local n = #KEYS - 1
if #ARGV ~= n + 2 then
    return {err = "Length mismatch"}
end

-- Update Redis
for i = 1, n do
    redis.call("SET", KEYS[i], ARGV[i], "EX", ARGV[#ARGV - 1])
end

-- version increment and updatedAt set
redis.call('SET', KEYS[#KEYS], ARGV[#ARGV], 'EX', ARGV[#ARGV - 1])

return {ok = "Setted multiple values successfully"}