from rest_framework import serializers
from .models import User
from django.contrib.auth import authenticate

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["email", "password"]

        extra_kwargs = {"password": {"write_only": True}}

    def validate(self, attrs):
        if not attrs["email"]:
            raise serializers.ValidationError("email required")
        if not attrs["password"]:
            raise serializers.ValidationError("password requird")

        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):

        if not attrs["email"]:
            raise serializers.ValidationError("email required")
        if not attrs["password"]:
            raise serializers.ValidationError("password requird")
        user = authenticate(email = attrs['email'],password = attrs['password'])
        if not user:
            raise serializers.ValidationError('Please enter a valid email and password')

        attrs['user'] = user
        return attrs
   
