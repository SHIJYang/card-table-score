<script setup lang="ts">
  // No imports needed! TresJS components are available globally
  </script>
  
  <template>
    <!-- Camera Setup -->
    <TresPerspectiveCamera
      :position="[7, 7, 7]"
      :look-at="[0, 0, 0]"
    />
  
    <!-- The Donut -->
    <TresMesh :position="[0, 2, 0]">
      <TresTorusGeometry :args="[1, 0.4, 16, 32]" />
      <TresMeshBasicMaterial color="#ff6b35" />
    </TresMesh>
  
    <!-- Visual Helpers -->
    <TresAxesHelper />
    <TresGridHelper />
  </template>
  