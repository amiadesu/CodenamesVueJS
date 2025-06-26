<template>
  <div id="home-view-background">
    <link href='https://fonts.googleapis.com/css?family=Lato:300,400,700' rel='stylesheet' type='text/css'>
    <div id='stars'></div>
    <div id='stars2'></div>
    <div id='stars3'></div>
  </div>
</template>

<style lang="scss" scoped>
@use 'sass:math';
@use 'sass:string';
@use 'sass:map';

// Function to get a random weighted star color
@function get-random-star-color() {
  // Define default weights for each color (can be customized)
  $weights: (
    '--star-color-1': 1,
    '--star-color-2': 1,
    '--star-color-3': 1,
    '--star-color-4': 1,
    '--star-color-5': 1
  );
  
  $total: 0;
  $accumulated: ();
  
  // Calculate total weight and accumulated weights
  @each $color, $weight in $weights {
    $total: $total + $weight;
    $accumulated: map.merge($accumulated, ($color: $total));
  }
  
  $random: math.random($total);
  $result: '--star-color-1'; // default
  
  @each $color, $weight in $accumulated {
    @if $random <= $weight {
      @return var(#{$color}, #FFF);
    }
  }
  
  @return var(#{$result}, #FFF);
}

// n is number of stars required
@function multiple-box-shadow ($n) {
  $value: '#{math.random(2000)}px #{math.random(2000)}px #{get-random-star-color()}';
  @for $i from 2 through $n {
    $value: '#{$value}, #{math.random(2000)}px #{math.random(2000)}px #{get-random-star-color()}';
  }
  @return string.unquote($value);
}

$shadows-small:  multiple-box-shadow(700);
$shadows-medium: multiple-box-shadow(200);
$shadows-big:    multiple-box-shadow(100);

#stars {
  width: 1px;
  height: 1px;
  background: transparent;
  box-shadow: $shadows-small;
  animation: animStar 50s linear infinite;
    
  &:after {
    content: " ";
    position: absolute;
    top: 2000px;
    width: 1px;
    height: 1px;
    background: transparent;
    box-shadow: $shadows-small;
  }
}
    
#stars2 {
  width: 2px;
  height: 2px;
  background: transparent;
  box-shadow: $shadows-medium;
  animation: animStar 100s linear infinite;
    
  &:after {
    content: " ";
    position: absolute;
    top: 2000px;
    width: 2px;
    height: 2px;
    background: transparent;
    box-shadow: $shadows-medium;
  }
}
    
#stars3 {
  width: 3px;
  height: 3px;
  background: transparent;
  box-shadow: $shadows-big;
  animation: animStar 150s linear infinite;
    
  &:after {
    content: " ";
    position: absolute;
    top: 2000px;
    width: 3px;
    height: 3px;
    background: transparent;
    box-shadow: $shadows-big;
  }
}
    
@keyframes animStar {
  from { transform: translateY(0px); }
  to { transform: translateY(-2000px); }
}
</style>

<style lang="css">
#home-view-background {
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: -1;
}
</style>