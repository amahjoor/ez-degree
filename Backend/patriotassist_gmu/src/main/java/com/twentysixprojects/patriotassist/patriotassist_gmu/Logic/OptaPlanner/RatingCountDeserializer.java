package com.twentysixprojects.patriotassist.patriotassist_gmu.Logic.OptaPlanner;

// File: RatingCountDeserializer.java
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import java.io.IOException;

public class RatingCountDeserializer extends StdDeserializer<Integer> {

    public RatingCountDeserializer() {
        this(null);
    }

    public RatingCountDeserializer(Class<?> vc) {
        super(vc);
    }

    @Override
    public Integer deserialize(JsonParser jp, DeserializationContext ctxt)
            throws IOException, JsonProcessingException {
        String ratingCountText = jp.getText();
        // Expecting format like "31 ratings". Extract the first part.
        String[] parts = ratingCountText.split(" ");
        try {
            return Integer.parseInt(parts[0]);
        } catch (NumberFormatException e) {
            return 0; // or throw an exception if preferred
        }
    }
}

